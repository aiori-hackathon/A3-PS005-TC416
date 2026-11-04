"""Unit tests for WP-02: Peer-session identity and corroboration.

Tests compliance with WP-02 requirements:
- Distinguish peer sessions, peer ASNs, and collector vantage points.
- Three updates from the same peer session produce 3 observations and 1 distinct peer session.
- Two peer IPs on the same collector produce 2 sessions and 1 collector vantage point.
- Two collectors produce 2 collector vantage points.
- Same peer ASN seen from different peer IPs produces 2 sessions and 1 peer ASN.
- Missing peer IP in live collection does not count as a new peer session.
- Missing peer ASN does not fabricate an ASN label.
- Candidate does not promote with 3 observations from only 1 session.
- Candidate promotes only when both >= 2 distinct peer sessions AND >= 3 observations are met.
- Duplicate observations do not inflate session diversity.
- Confidence text does not overclaim widespread global propagation.
"""

import os
import tempfile
import pytest

from horaq.database import db_session, get_baseline_by_prefix, init_db
from horaq.detection import derive_peer_session, process_observation


@pytest.fixture
def test_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_derive_peer_session_dimensions():
    """Verify separate identity dimensions: session, peer_as, and collector."""
    # 1. Normal peer IP + peer ASN + collector
    sess, p_as, col = derive_peer_session("rrc00", "193.0.0.1", "3333")
    assert sess == "rrc00:193.0.0.1"
    assert p_as == "AS3333"
    assert col == "rrc00"

    # 2. Missing peer IP in live collection -> session is None (not fabricated)
    sess_live, p_as_live, col_live = derive_peer_session("rrc00", None, "3333", scenario="ripe-ris-live")
    assert sess_live is None
    assert p_as_live == "AS3333"
    assert col_live == "rrc00"

    # 3. Missing peer ASN -> peer_as is None (no 'peer' or 'ASunknown')
    sess3, p_as3, col3 = derive_peer_session("rrc01", "198.51.100.5", None)
    assert sess3 == "rrc01:198.51.100.5"
    assert p_as3 is None
    assert col3 == "rrc01"


def test_repeated_updates_same_peer_session_does_not_promote(test_db):
    """Three observations from the SAME peer session produce 3 observations, 1 session, and stay CANDIDATE."""
    for i in range(3):
        res = process_observation(
            db_path=test_db,
            prefix_raw="198.51.100.0/24",
            origin_asn_raw="AS64500",
            collector="rrc00",
            peer_ip="193.0.0.10",
            peer_as="64500",
            scenario="same-peer-test",
        )
        assert res["alerts_count"] == 0

    base = get_baseline_by_prefix(test_db, "198.51.100.0/24")
    assert base is not None
    assert base["observation_count"] == 3
    assert base["peer_count"] == 1
    assert base["status"] == "CANDIDATE"
    assert len(base["distinct_peers"]) == 1
    assert base["distinct_peers"][0] == "rrc00:193.0.0.10"


def test_two_peer_ips_same_collector_promotes_after_three_obs(test_db):
    """Two peer IPs on the same collector: 2 sessions, 1 collector, promotes at 3 observations."""
    # Obs 1: Peer IP A
    process_observation(
        db_path=test_db,
        prefix_raw="198.51.100.0/24",
        origin_asn_raw="AS64500",
        collector="rrc00",
        peer_ip="193.0.0.1",
        peer_as="64500",
    )
    # Obs 2: Peer IP A again
    process_observation(
        db_path=test_db,
        prefix_raw="198.51.100.0/24",
        origin_asn_raw="AS64500",
        collector="rrc00",
        peer_ip="193.0.0.1",
        peer_as="64500",
    )
    # Obs 3: Peer IP B (distinct session on same collector!)
    process_observation(
        db_path=test_db,
        prefix_raw="198.51.100.0/24",
        origin_asn_raw="AS64500",
        collector="rrc00",
        peer_ip="193.0.0.2",
        peer_as="64500",
    )

    base = get_baseline_by_prefix(test_db, "198.51.100.0/24")
    assert base["observation_count"] == 3
    assert base["peer_count"] == 2
    assert base["status"] == "PROMOTED"
    assert base["collector_count"] == 1  # Still 1 collector vantage point!
    assert base["peer_asn_count"] == 1   # Still 1 peer ASN (AS64500)!


def test_same_peer_asn_different_collectors_distinguishes_counts(test_db):
    """Same peer ASN seen across 2 collectors has peer_asn_count=1 and collector_count=2."""
    process_observation(
        db_path=test_db,
        prefix_raw="203.0.113.0/24",
        origin_asn_raw="AS65000",
        collector="rrc00",
        peer_ip="193.0.0.1",
        peer_as="3333",
    )
    process_observation(
        db_path=test_db,
        prefix_raw="203.0.113.0/24",
        origin_asn_raw="AS65000",
        collector="rrc01",
        peer_ip="193.0.0.2",
        peer_as="3333",
    )
    base = get_baseline_by_prefix(test_db, "203.0.113.0/24")
    assert base["peer_count"] == 2       # 2 distinct sessions
    assert base["collector_count"] == 2  # 2 distinct collectors
    assert base["peer_asn_count"] == 1   # 1 distinct peer ASN (AS3333)


def test_missing_peer_ip_in_live_feed_does_not_count_as_session(test_db):
    """In live feed, missing peer IP must not fabricate a session or count toward 2-peer promotion."""
    for i in range(3):
        process_observation(
            db_path=test_db,
            prefix_raw="192.0.2.0/24",
            origin_asn_raw="AS64500",
            collector="rrc00",
            peer_ip=None,
            peer_as=None,
            scenario="ripe-ris-live",
        )

    base = get_baseline_by_prefix(test_db, "192.0.2.0/24")
    assert base["observation_count"] == 3
    assert base["peer_count"] == 0
    assert base["status"] == "CANDIDATE"


def test_confidence_text_does_not_overclaim_global_propagation(test_db):
    """Verify confidence assessment text uses exact counts rather than 'widespread global propagation'."""
    # Seed parent baseline
    process_observation(
        db_path=test_db,
        prefix_raw="10.0.0.0/8",
        origin_asn_raw="AS1000",
        authorized_seed=True,
    )

    # Rogue subprefix observed from 2 distinct sessions on 1 collector
    process_observation(
        db_path=test_db,
        prefix_raw="10.1.0.0/16",
        origin_asn_raw="AS9999",
        collector="rrc00",
        peer_ip="193.0.0.1",
        peer_as="1234",
    )
    r2 = process_observation(
        db_path=test_db,
        prefix_raw="10.1.0.0/16",
        origin_asn_raw="AS9999",
        collector="rrc00",
        peer_ip="193.0.0.2",
        peer_as="1234",
    )

    assert r2["alerts_count"] == 1
    alert = r2["alerts"][0]
    reason = alert["uncertainty_reason"]
    # Check that overclaiming string is absent
    assert "widespread global propagation" not in reason.lower()
    # Check that exact counts are present
    assert "distinct peer session" in reason.lower()
    assert "collector vantage point" in reason.lower()

