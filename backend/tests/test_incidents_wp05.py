"""Tests for WP-05: Incident Correlation, Lifecycle Classifications, and Non-Destructive Grouping."""

import json
import os
import tempfile
import pytest

from horaq.database import (
    init_db,
    db_session,
    list_incidents,
    get_incident_by_id,
    list_alerts,
    list_observations,
    list_evidence,
    derive_incident_correlation_key,
)
from horaq.detection import process_observation, process_withdrawal
from horaq.crypto import sign_data


@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_repeated_observations_link_to_one_incident(temp_db):
    """Repeated observations of the same conflict within correlation window link to one logical incident."""
    # Seed baseline
    process_observation(temp_db, "10.0.0.0/16", "AS15169", "rrc00", "2026-03-01T10:00:00Z", peer_as="AS101", peer_ip="192.0.2.1")
    process_observation(temp_db, "10.0.0.0/16", "AS15169", "rrc01", "2026-03-01T10:01:00Z", peer_as="AS102", peer_ip="192.0.2.2")
    process_observation(temp_db, "10.0.0.0/16", "AS15169", "rrc00", "2026-03-01T10:02:00Z", peer_as="AS101", peer_ip="192.0.2.1")

    # Conflict observation 1 (AS200)
    res1 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc00", "2026-03-01T11:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    assert len(res1["alerts"]) == 1
    alert1 = res1["alerts"][0]
    inc_id1 = alert1["incident_id"]
    assert inc_id1 is not None

    # Conflict observation 2 (same AS200, 10 minutes later)
    res2 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc01", "2026-03-01T11:10:00Z", peer_as="AS302", peer_ip="198.51.100.2")
    assert len(res2["alerts"]) == 1
    alert2 = res2["alerts"][0]
    inc_id2 = alert2["incident_id"]

    # Both alerts link to the SAME incident
    assert inc_id1 == inc_id2

    # Both alerts and observations remain individually preserved
    obs, total_obs = list_observations(temp_db)
    assert total_obs == 5  # 3 baseline + 2 anomaly observations

    alerts, total_alerts = list_alerts(temp_db)
    assert total_alerts == 2

    # Check the incident details
    inc = get_incident_by_id(temp_db, inc_id1)
    assert inc is not None
    assert inc["event_count"] == 2
    assert inc["status"] == "ACTIVE"
    assert len(inc["alerts"]) == 2
    assert "rrc00" in inc["source_collectors"]
    assert "rrc01" in inc["source_collectors"]


def test_different_observed_asn_creates_different_incident(temp_db):
    """A different observed ASN creates a different incident identity."""
    # Seed baseline
    for i in range(3):
        process_observation(temp_db, "10.0.0.0/16", "AS15169", f"rrc0{i%2}", f"2026-03-01T10:0{i}:00Z", peer_as=f"AS10{i%2}", peer_ip=f"192.0.2.{i+1}")

    # Conflict with AS200
    res1 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc00", "2026-03-01T11:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    # Conflict with AS300
    res2 = process_observation(temp_db, "10.0.0.0/16", "AS300", "rrc00", "2026-03-01T11:01:00Z", peer_as="AS301", peer_ip="198.51.100.1")

    inc_id1 = res1["alerts"][0]["incident_id"]
    inc_id2 = res2["alerts"][0]["incident_id"]

    assert inc_id1 != inc_id2

    inc1 = get_incident_by_id(temp_db, inc_id1)
    inc2 = get_incident_by_id(temp_db, inc_id2)
    assert inc1["observed_asn"] == "AS200"
    assert inc2["observed_asn"] == "AS300"


def test_origin_conflict_and_subprefix_anomaly_not_merged(temp_db):
    """An origin conflict and a subprefix anomaly are not merged."""
    # Seed parent baseline
    for i in range(3):
        process_observation(temp_db, "10.0.0.0/16", "AS15169", f"rrc0{i%2}", f"2026-03-01T10:0{i}:00Z", peer_as=f"AS10{i%2}", peer_ip=f"192.0.2.{i+1}")

    # Origin change on parent
    res_orig = process_observation(temp_db, "10.0.0.0/16", "AS999", "rrc00", "2026-03-01T11:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    # Subprefix anomaly
    res_sub = process_observation(temp_db, "10.0.1.0/24", "AS999", "rrc00", "2026-03-01T11:05:00Z", peer_as="AS301", peer_ip="198.51.100.1")

    inc_id_orig = res_orig["alerts"][0]["incident_id"]
    inc_id_sub = res_sub["alerts"][0]["incident_id"]

    assert inc_id_orig != inc_id_sub

    inc_orig = get_incident_by_id(temp_db, inc_id_orig)
    inc_sub = get_incident_by_id(temp_db, inc_id_sub)
    assert inc_orig["kind"] == "ORIGIN_CHANGE"
    assert inc_sub["kind"] == "SUBPREFIX_ANOMALY"


def test_events_outside_correlation_window_create_recurrence(temp_db):
    """Events outside the configured correlation window or after resolution increment recurrence."""
    # Seed baseline
    for i in range(3):
        process_observation(temp_db, "10.0.0.0/16", "AS15169", f"rrc0{i%2}", f"2026-03-01T10:0{i}:00Z", peer_as=f"AS10{i%2}", peer_ip=f"192.0.2.{i+1}")

    # First event at 11:00
    res1 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc00", "2026-03-01T11:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    inc_id1 = res1["alerts"][0]["incident_id"]

    # Resolve via withdrawal
    w_res = process_withdrawal(temp_db, "10.0.0.0/16", collector="rrc00", timestamp_raw="2026-03-01T11:30:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    assert len(w_res["resolved_alerts"]) == 1

    # Check incident 1 is RESOLVED
    inc1 = get_incident_by_id(temp_db, inc_id1)
    assert inc1["status"] == "RESOLVED"

    # Second event at 14:00 (after resolution and outside 1h correlation window)
    res2 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc00", "2026-03-01T14:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    inc_id2 = res2["alerts"][0]["incident_id"]

    assert inc_id1 != inc_id2
    inc2 = get_incident_by_id(temp_db, inc_id2)
    assert inc2["recurrence_count"] == 1
    assert inc2["lifecycle_classification"] == "RECURRENT"
    assert inc2["status"] == "ACTIVE"


def test_event_duration_computed_from_source_timestamps(temp_db):
    """Event duration is computed from source timestamps, transitioning to PERSISTENT."""
    for i in range(3):
        process_observation(temp_db, "10.0.0.0/16", "AS15169", f"rrc0{i%2}", f"2026-03-01T10:0{i}:00Z", peer_as=f"AS10{i%2}", peer_ip=f"192.0.2.{i+1}")

    # First observation at 11:00:00
    res1 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc00", "2026-03-01T11:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    inc_id1 = res1["alerts"][0]["incident_id"]
    inc1 = get_incident_by_id(temp_db, inc_id1)
    assert inc1["lifecycle_classification"] == "TRANSIENT"

    # Second observation 10 minutes later (duration = 600s >= 300s threshold)
    res2 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc01", "2026-03-01T11:10:00Z", peer_as="AS302", peer_ip="198.51.100.2")
    inc2 = get_incident_by_id(temp_db, inc_id1)
    assert inc2["lifecycle_classification"] == "PERSISTENT"
    assert inc2["event_count"] == 2


def test_resolution_and_recurrence_preserve_signed_evidence(temp_db):
    """Resolution and later recurrence never alter previous signed evidence records."""
    for i in range(3):
        process_observation(temp_db, "10.0.0.0/16", "AS15169", f"rrc0{i%2}", f"2026-03-01T10:0{i}:00Z", peer_as=f"AS10{i%2}", peer_ip=f"192.0.2.{i+1}")

    # Conflict
    res1 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc00", "2026-03-01T11:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    ev_id1 = res1["alerts"][0]["evidence_id"]

    # Sign evidence
    with db_session(temp_db) as conn:
        ev_row = conn.execute("SELECT canonical_json FROM evidence WHERE id = ?;", (ev_id1,)).fetchone()
        canon_bytes = ev_row[0].encode("utf-8")
        sig_hex, pk_hex = sign_data(canon_bytes)
        conn.execute("UPDATE evidence SET signature = ?, public_key = ?, signer_status = 'SIGNED' WHERE id = ?;", (sig_hex, pk_hex, ev_id1))

    # Withdraw
    process_withdrawal(temp_db, "10.0.0.0/16", collector="rrc00", timestamp_raw="2026-03-01T11:30:00Z", peer_as="AS301", peer_ip="198.51.100.1")

    # New recurrence event later
    res2 = process_observation(temp_db, "10.0.0.0/16", "AS200", "rrc00", "2026-03-01T14:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")
    ev_id2 = res2["alerts"][0]["evidence_id"]
    assert ev_id1 != ev_id2

    # Verify original signed evidence record is untouched
    with db_session(temp_db) as conn:
        ev1 = conn.execute("SELECT signer_status, signature FROM evidence WHERE id = ?;", (ev_id1,)).fetchone()
        assert ev1["signer_status"] == "SIGNED"
        assert ev1["signature"] == sig_hex
