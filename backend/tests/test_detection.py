"""Unit tests for detection algorithms: baseline seeding, origin changes, and subprefix anomalies."""

import os
import tempfile
import pytest
from horaq.database import (
    get_all_baselines,
    get_baseline_by_prefix,
    init_db,
    list_alerts,
)
from horaq.detection import process_observation


@pytest.fixture
def test_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def test_baseline_seeding_creates_no_alert(test_db):
    res = process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        origin_asn_raw=64496,
        collector="test-collector",
    )
    assert res["status"] == "ACCEPTED"
    assert res["alerts_count"] == 0

    base = get_baseline_by_prefix(test_db, "192.0.2.0/24")
    assert base is not None
    assert base["origin_asn"] == "AS64496"
    assert base["observation_count"] == 1


def test_same_origin_updates_observation_count(test_db):
    # First observation seeds baseline
    process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        origin_asn_raw="AS64496",
    )
    # Second observation with same origin
    res2 = process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        origin_asn_raw="AS64496",
    )
    assert res2["alerts_count"] == 0

    base = get_baseline_by_prefix(test_db, "192.0.2.0/24")
    assert base["observation_count"] == 2


def test_origin_change_generates_alert_and_preserves_baseline(test_db):
    # Seed baseline
    process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        origin_asn_raw="AS64496",
    )

    # Observation with different origin ASN
    res = process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        origin_asn_raw="AS64511",
        collector="test-collector",
    )

    assert res["alerts_count"] == 1
    alert = res["alerts"][0]
    assert alert["kind"] == "ORIGIN_CHANGE"
    assert alert["observed_asn"] == "AS64511"
    assert alert["baseline_asn"] == "AS64496"
    assert alert["severity"] == "HIGH"

    # Baseline must NOT be silently replaced
    base = get_baseline_by_prefix(test_db, "192.0.2.0/24")
    assert base["origin_asn"] == "AS64496"


def test_subprefix_anomaly_detection(test_db):
    # 1. Establish parent baseline route: 192.0.2.0/24
    process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        origin_asn_raw="AS64496",
    )

    # 2. Announce child subnet: 192.0.2.128/25 (contained inside 192.0.2.0/24)
    res = process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.128/25",
        origin_asn_raw="AS64500",
    )

    assert res["alerts_count"] == 1
    alert = res["alerts"][0]
    assert alert["kind"] == "SUBPREFIX_ANOMALY"
    assert alert["parent_prefix"] == "192.0.2.0/24"
    assert alert["observed_asn"] == "AS64500"

    # CRITICAL: Suspicious child subprefix MUST NOT poison or establish a baseline!
    assert get_baseline_by_prefix(test_db, "192.0.2.128/25") is None
    parent_base = get_baseline_by_prefix(test_db, "192.0.2.0/24")
    assert parent_base is not None
    assert parent_base["origin_asn"] == "AS64496"


def test_ipv6_subprefix_anomaly_detection(test_db):
    # 1. Establish parent baseline: 2001:db8::/32
    process_observation(
        db_path=test_db,
        prefix_raw="2001:db8::/32",
        origin_asn_raw="AS64496",
    )

    # 2. Announce more-specific child /48
    res = process_observation(
        db_path=test_db,
        prefix_raw="2001:db8:1::/48",
        origin_asn_raw="AS64505",
    )

    assert res["alerts_count"] == 1
    alert = res["alerts"][0]
    assert alert["kind"] == "SUBPREFIX_ANOMALY"
    assert alert["parent_prefix"] == "2001:db8::/32"

    # CRITICAL: Suspicious IPv6 child subprefix MUST NOT poison or establish a baseline!
    assert get_baseline_by_prefix(test_db, "2001:db8:1::/48") is None
    parent_base = get_baseline_by_prefix(test_db, "2001:db8::/32")
    assert parent_base is not None
    assert parent_base["origin_asn"] == "AS64496"


def test_suspicious_subprefix_does_not_poison_baseline(test_db):
    """Regression test proving complete baseline preservation against poisoning."""
    # 1. Establish legitimate baseline
    r1 = process_observation(
        db_path=test_db,
        prefix_raw="8.8.8.0/24",
        origin_asn_raw=15169,
        collector="rrc00",
    )
    assert r1["alerts_count"] == 0

    # 2. Inject rogue subprefix
    r2 = process_observation(
        db_path=test_db,
        prefix_raw="8.8.8.128/25",
        origin_asn_raw=66666,
        collector="rrc03",
    )
    assert r2["alerts_count"] == 1
    assert r2["alerts"][0]["kind"] == "SUBPREFIX_ANOMALY"

    # 3. Baselines table must contain ONLY 8.8.8.0/24, NOT 8.8.8.128/25
    all_bases = get_all_baselines(test_db)
    assert len(all_bases) == 1
    assert all_bases[0]["prefix"] == "8.8.8.0/24"
    assert all_bases[0]["origin_asn"] == "AS15169"
    assert get_baseline_by_prefix(test_db, "8.8.8.128/25") is None

    # 4. Subsequent legitimate parent observation increments observation_count
    r3 = process_observation(
        db_path=test_db,
        prefix_raw="8.8.8.0/24",
        origin_asn_raw=15169,
        collector="rrc00",
    )
    assert r3["alerts_count"] == 0
    updated_parent = get_baseline_by_prefix(test_db, "8.8.8.0/24")
    assert updated_parent["observation_count"] == 2


def test_candidate_policy_peer_diversity_invariant(test_db):
    """Verifies that single-peer route flapping cannot promote to trusted reference state."""
    # Observations 1, 2, 3 all from the SAME peer AS64500
    for i in range(3):
        process_observation(
            db_path=test_db,
            prefix_raw="198.51.100.0/24",
            origin_asn_raw="AS64500",
            collector="rrc00",
            peer_as="64500",
            scenario="single-peer-flap-test",
        )

    base = get_baseline_by_prefix(test_db, "198.51.100.0/24")
    assert base is not None
    assert base["observation_count"] == 3
    assert base["peer_count"] == 1
    # INVARIANT: Must stay CANDIDATE because peer diversity is only 1!
    assert base["status"] == "CANDIDATE"

    # Observation 4 from a DISTINCT 2nd peer AS64501
    process_observation(
        db_path=test_db,
        prefix_raw="198.51.100.0/24",
        origin_asn_raw="AS64500",
        collector="rrc00",
        peer_as="64501",
        scenario="corroborated-promotion-test",
    )

    promoted_base = get_baseline_by_prefix(test_db, "198.51.100.0/24")
    assert promoted_base["peer_count"] == 2
    # INVARIANT: Now promoted to PROMOTED because peer diversity threshold (>=2) is met!
    assert promoted_base["status"] == "PROMOTED"


def test_withdrawal_recovery_resolution(test_db):
    """Verifies that a BGP withdrawal resolves active alerts and records recovery."""
    from horaq.detection import process_withdrawal
    from horaq.database import db_session

    # 1. Establish parent route
    process_observation(
        db_path=test_db,
        prefix_raw="208.65.152.0/22",
        origin_asn_raw="AS36561",
        collector="rrc00",
        peer_as="3356",
        scenario="baseline-seed",
    )

    # 2. Announce rogue subprefix (triggers ACTIVE alert)
    obs_res = process_observation(
        db_path=test_db,
        prefix_raw="208.65.153.0/24",
        origin_asn_raw="AS17557",
        collector="rrc00",
        peer_as="3333",
        scenario="hijack-test",
    )
    assert obs_res["alerts_count"] == 1
    alert_id = obs_res["alerts"][0]["id"]
    assert obs_res["alerts"][0]["status"] == "ACTIVE"

    # 3. Ingest route withdrawal for the rogue subprefix
    w_res = process_withdrawal(
        db_path=test_db,
        prefix_raw="208.65.153.0/24",
        collector="rrc00",
        peer_as="3333",
        scenario="hijack-test",
    )
    assert w_res["resolved_alerts_count"] == 1
    assert w_res["status"] == "WITHDRAWN"

    # 4. Verify in database that alert status transitioned to RESOLVED with recovery note
    with db_session(test_db) as conn:
        alert_row = conn.execute("SELECT status, explanation, recovery_status FROM alerts WHERE id = ?;", (alert_id,)).fetchone()
    assert alert_row["status"] == "RESOLVED"
    assert alert_row["recovery_status"] == "CONFIRMED"
    assert "[RECOVERY]" in alert_row["explanation"]


def test_multi_peer_withdrawal_recovery_semantics(test_db):
    """Verify that a single peer's withdrawal does not resolve alerts supported by other peers.

    Regression test for Critical Issue 3:
    In BGP, a withdrawal reflects route withdrawal from a specific peer relationship.
    When multiple peers announce an anomalous route, one peer's withdrawal must resolve only
    that peer's alert, leaving alerts from non-withdrawn peers active.
    """
    from horaq.detection import process_withdrawal
    from horaq.database import db_session

    # 1. Establish parent baseline
    for p in ["3356", "12859"]:
        process_observation(
            db_path=test_db,
            prefix_raw="208.65.152.0/22",
            origin_asn_raw="AS36561",
            collector="rrc00",
            peer_as=p,
            scenario="baseline-seed",
        )

    # 2. Peer A (AS3333) announces rogue subprefix
    obs_a = process_observation(
        db_path=test_db,
        prefix_raw="208.65.153.0/24",
        origin_asn_raw="AS17557",
        collector="rrc00",
        peer_as="3333",
        scenario="multi-peer-hijack",
    )
    assert obs_a["alerts_count"] == 1
    alert_a_id = obs_a["alerts"][0]["id"]

    # 3. Peer B (AS3549) announces rogue subprefix
    obs_b = process_observation(
        db_path=test_db,
        prefix_raw="208.65.153.0/24",
        origin_asn_raw="AS17557",
        collector="rrc00",
        peer_as="3549",
        scenario="multi-peer-hijack",
    )
    assert obs_b["alerts_count"] == 1
    alert_b_id = obs_b["alerts"][0]["id"]

    # 4. Peer A (AS3333) withdraws its route
    w_res_a = process_withdrawal(
        db_path=test_db,
        prefix_raw="208.65.153.0/24",
        collector="rrc00",
        peer_as="3333",
        scenario="multi-peer-hijack",
    )
    assert w_res_a["resolved_alerts_count"] == 1
    assert w_res_a["unresolved_alerts_count"] == 1

    # Invariant: Alert A must be RESOLVED, but Alert B must remain ACTIVE!
    with db_session(test_db) as conn:
        row_a = conn.execute("SELECT status, recovery_status FROM alerts WHERE id = ?;", (alert_a_id,)).fetchone()
        row_b = conn.execute("SELECT status, recovery_status FROM alerts WHERE id = ?;", (alert_b_id,)).fetchone()

    assert row_a["status"] == "RESOLVED"
    assert row_a["recovery_status"] == "CONFIRMED"
    assert row_b["status"] == "ACTIVE"
    assert row_b["recovery_status"] == "UNCONFIRMED"

    # 5. Peer B (AS3549) now withdraws its route as well
    w_res_b = process_withdrawal(
        db_path=test_db,
        prefix_raw="208.65.153.0/24",
        collector="rrc00",
        peer_as="3549",
        scenario="multi-peer-hijack",
    )
    assert w_res_b["resolved_alerts_count"] == 1
    assert w_res_b["unresolved_alerts_count"] == 0

    with db_session(test_db) as conn:
        row_b2 = conn.execute("SELECT status, recovery_status FROM alerts WHERE id = ?;", (alert_b_id,)).fetchone()
    assert row_b2["status"] == "RESOLVED"
    assert row_b2["recovery_status"] == "CONFIRMED"


def test_unauthorized_seed_escalation_blocked(test_db):
    """P1 Regression Test: Verify caller cannot self-promote a baseline via scenario or metadata.

    Untrusted observations passing scenario='baseline-seed' or metadata={'trusted_seed': True}
    MUST NOT be granted immediate baseline trust. They must remain quarantined as CANDIDATE.
    """
    # 1. Attacker attempts seed escalation via scenario name
    res_scenario = process_observation(
        db_path=test_db,
        prefix_raw="198.18.0.0/24",
        origin_asn_raw="AS64512",
        collector="untrusted-peer",
        scenario="seed-production-baseline",
    )
    base_scenario = get_baseline_by_prefix(test_db, "198.18.0.0/24")
    assert base_scenario is not None
    assert base_scenario["status"] == "CANDIDATE", "Unauthorized scenario string caused baseline promotion!"

    # 2. Attacker attempts seed escalation via metadata flag
    res_metadata = process_observation(
        db_path=test_db,
        prefix_raw="198.19.0.0/24",
        origin_asn_raw="AS64513",
        collector="untrusted-peer",
        raw_metadata={"trusted_seed": True, "authorized": True},
    )
    base_metadata = get_baseline_by_prefix(test_db, "198.19.0.0/24")
    assert base_metadata is not None
    assert base_metadata["status"] == "CANDIDATE", "Unauthorized metadata flag caused baseline promotion!"

    # 3. Legitimate authorized seeding operation promotes immediately
    res_auth = process_observation(
        db_path=test_db,
        prefix_raw="198.20.0.0/24",
        origin_asn_raw="AS64514",
        collector="operator-cli",
        authorized_seed=True,
        actor="OPERATOR_ROOT",
    )
    base_auth = get_baseline_by_prefix(test_db, "198.20.0.0/24")
    assert base_auth is not None
    assert base_auth["status"] == "PROMOTED", "Explicitly authorized seed was not promoted!"


def test_baseline_history_append_only_audit_trail(test_db):
    """P1 Regression Test: Verify Proposal D2 versioned baseline append-only event table.

    Records initial candidate discovery, promotion decisions, rejected anomaly attacks,
    and withdrawals with actor provenance and justification.
    """
    from horaq.database import list_baseline_history
    from horaq.detection import process_withdrawal

    # 1. Authorized seed leaves an audit event
    process_observation(
        db_path=test_db,
        prefix_raw="100.64.0.0/20",
        origin_asn_raw="AS65000",
        authorized_seed=True,
        actor="NETENG_ADMIN",
    )

    # 2. Wild observation creates a CANDIDATE audit event
    process_observation(
        db_path=test_db,
        prefix_raw="100.64.16.0/24",
        origin_asn_raw="AS65001",
        collector="rrc01",
        peer_as="AS100",
        actor="INGESTION_AGENT",
    )

    # 3. Corroboration from distinct peers promotes CANDIDATE to PROMOTED
    process_observation(
        db_path=test_db,
        prefix_raw="100.64.16.0/24",
        origin_asn_raw="AS65001",
        collector="rrc02",
        peer_as="AS200",
        actor="INGESTION_AGENT",
    )
    process_observation(
        db_path=test_db,
        prefix_raw="100.64.16.0/24",
        origin_asn_raw="AS65001",
        collector="rrc03",
        peer_as="AS300",
        actor="INGESTION_AGENT",
    )

    # 4. Rogue announcement against 100.64.0.0/20 creates REJECTED_ATTEMPT event
    process_observation(
        db_path=test_db,
        prefix_raw="100.64.0.0/20",
        origin_asn_raw="AS66666",
        collector="rrc00",
        peer_as="AS999",
    )

    # 5. Withdrawal of uncorroborated candidate creates WITHDRAWN event
    process_observation(
        db_path=test_db,
        prefix_raw="100.64.32.0/24",
        origin_asn_raw="AS65002",
        peer_as="AS500",
    )
    process_withdrawal(
        db_path=test_db,
        prefix_raw="100.64.32.0/24",
        peer_as="AS500",
    )

    # Verify history table content and completeness
    events, total = list_baseline_history(test_db, limit=100)
    assert total >= 5

    transition_types = [e["transition_type"] for e in events]
    assert "AUTHORIZED_SEED" in transition_types
    assert "INITIAL_CANDIDATE" in transition_types
    assert "PROMOTED_CORROBORATED" in transition_types
    assert "REJECTED_ATTEMPT" in transition_types
    assert "WITHDRAWN" in transition_types

    # Verify prefix-specific filter
    pfx_events, pfx_total = list_baseline_history(test_db, prefix="100.64.0.0/20")
    assert pfx_total == 2  # AUTHORIZED_SEED + REJECTED_ATTEMPT
    assert pfx_events[0]["transition_type"] in ("REJECTED_ATTEMPT", "AUTHORIZED_SEED")
    assert pfx_events[0]["actor"] is not None
    assert pfx_events[0]["reason"] is not None


def test_withdrawal_with_missing_peer_leaves_alert_active(test_db):
    """P1 Regression Test: An unknown peer (peer_as=None) must NOT resolve alerts."""
    from horaq.detection import process_withdrawal
    from horaq.database import db_session

    # Seed baseline
    process_observation(
        db_path=test_db,
        prefix_raw="203.0.113.0/24",
        origin_asn_raw="AS64500",
        authorized_seed=True,
    )

    # Hijack announced by peer AS3333
    obs_res = process_observation(
        db_path=test_db,
        prefix_raw="203.0.113.0/24",
        origin_asn_raw="AS64511",
        peer_as="3333",
    )
    assert obs_res["alerts_count"] == 1
    alert_id = obs_res["alerts"][0]["id"]

    # Withdrawal arrives with NO peer metadata (peer_as=None)
    w_res = process_withdrawal(
        db_path=test_db,
        prefix_raw="203.0.113.0/24",
        peer_as=None,
    )
    assert w_res["resolved_alerts_count"] == 0
    assert w_res["unresolved_alerts_count"] == 1
    assert w_res["unresolved_alerts"][0]["reason"] == "MISSING_PEER_METADATA"

    with db_session(test_db) as conn:
        alert_row = conn.execute("SELECT status, recovery_status FROM alerts WHERE id = ?;", (alert_id,)).fetchone()
    assert alert_row["status"] == "ACTIVE", "Alert was resolved by withdrawal with missing peer metadata!"
    assert alert_row["recovery_status"] == "UNCONFIRMED"


def test_withdrawal_with_unrelated_peer_leaves_alert_active(test_db):
    """P1 Regression Test: Withdrawal from an unrelated peer must NOT resolve alert."""
    from horaq.detection import process_withdrawal
    from horaq.database import db_session

    process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        origin_asn_raw="AS64496",
        authorized_seed=True,
    )
    obs_res = process_observation(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        origin_asn_raw="AS64599",
        peer_as="3333",
    )
    alert_id = obs_res["alerts"][0]["id"]

    # Withdrawal from unrelated peer AS9999
    w_res = process_withdrawal(
        db_path=test_db,
        prefix_raw="192.0.2.0/24",
        peer_as="9999",
    )
    assert w_res["resolved_alerts_count"] == 0
    assert w_res["unresolved_alerts_count"] == 1
    assert w_res["unresolved_alerts"][0]["reason"] == "UNRELATED_PEER"

    with db_session(test_db) as conn:
        alert_row = conn.execute("SELECT status, recovery_status FROM alerts WHERE id = ?;", (alert_id,)).fetchone()
    assert alert_row["status"] == "ACTIVE"


def test_withdrawal_duplicate_is_idempotent(test_db):
    """P1 Regression Test: Duplicate withdrawal from same peer is idempotent and does not corrupt state."""
    from horaq.detection import process_withdrawal
    from horaq.database import db_session

    process_observation(
        db_path=test_db,
        prefix_raw="198.51.100.0/24",
        origin_asn_raw="AS64497",
        authorized_seed=True,
    )
    obs_res = process_observation(
        db_path=test_db,
        prefix_raw="198.51.100.0/24",
        origin_asn_raw="AS64599",
        peer_as="3333",
    )
    alert_id = obs_res["alerts"][0]["id"]

    # First withdrawal resolves alert
    w1 = process_withdrawal(test_db, prefix_raw="198.51.100.0/24", peer_as="3333")
    assert w1["resolved_alerts_count"] == 1

    # Second withdrawal is duplicate (idempotent)
    w2 = process_withdrawal(test_db, prefix_raw="198.51.100.0/24", peer_as="3333")
    assert w2["resolved_alerts_count"] == 0

    with db_session(test_db) as conn:
        alert_row = conn.execute("SELECT status, recovery_status FROM alerts WHERE id = ?;", (alert_id,)).fetchone()
    assert alert_row["status"] == "RESOLVED"
    assert alert_row["recovery_status"] == "CONFIRMED"


def test_repeated_announcement_after_withdrawal(test_db):
    """P1 Regression Test: Re-announcing an attack after recovery generates a fresh active alert."""
    from horaq.detection import process_withdrawal
    from horaq.database import db_session

    process_observation(
        db_path=test_db,
        prefix_raw="208.65.152.0/22",
        origin_asn_raw="AS36561",
        authorized_seed=True,
    )

    # Initial hijack
    obs1 = process_observation(
        db_path=test_db,
        prefix_raw="208.65.153.0/24",
        origin_asn_raw="AS17557",
        peer_as="3333",
    )
    alert1_id = obs1["alerts"][0]["id"]

    # Attacker withdraws
    process_withdrawal(test_db, prefix_raw="208.65.153.0/24", peer_as="3333")

    with db_session(test_db) as conn:
        a1_row = conn.execute("SELECT status, recovery_status FROM alerts WHERE id = ?;", (alert1_id,)).fetchone()
    assert a1_row["status"] == "RESOLVED"

    # Attacker re-announces rogue subprefix
    obs2 = process_observation(
        db_path=test_db,
        prefix_raw="208.65.153.0/24",
        origin_asn_raw="AS17557",
        peer_as="3333",
    )
    assert obs2["alerts_count"] == 1
    alert2_id = obs2["alerts"][0]["id"]
    assert alert2_id != alert1_id
    assert obs2["alerts"][0]["status"] == "ACTIVE"
    assert obs2["alerts"][0]["recovery_status"] == "UNCONFIRMED"




