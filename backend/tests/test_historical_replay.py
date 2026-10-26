"""Automated regression tests for Historical BGP Incident Replays and Controls.

Verifies:
- YouTube Pakistan Telecom Subprefix Hijack (INC-2008-02-24-YOUTUBE-PTCL)
- Indosat Global Route Leak (INC-2014-04-02-INDOSAT-LEAK)
- Rostelecom Prefix Hijack (INC-2020-04-01-ROSTELECOM-LEAK)
- Legitimate Route Re-announcement Control (CONTROL-LEGITIMATE-SAME-ORIGIN-UPDATE)
- Legitimate Traffic Engineering Subprefix Control (CONTROL-LEGITIMATE-TRAFFIC-ENGINEERING-SUBPREFIX)
- Anti-poisoning invariant across all incidents
"""

import json
import os
import tempfile
from pathlib import Path
import pytest

from horaq.database import db_session, init_db
from horaq.detection import process_observation


@pytest.fixture
def replay_samples():
    root_dir = Path(__file__).resolve().parent.parent.parent
    samples_file = root_dir / "audit" / "historical_incident_samples.json"
    assert samples_file.exists(), f"Missing audit/historical_incident_samples.json at {samples_file}"
    with open(samples_file, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def isolated_db():
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(db_path)
    yield db_path
    if os.path.exists(db_path):
        os.remove(db_path)


def test_historical_incidents_execution(replay_samples, isolated_db):
    for incident in replay_samples:
        inc_id = incident["incident_id"]
        baseline_info = incident["ground_truth_baseline"]
        announcement = incident["incident_announcement"]
        expected = incident["expected_result"]

        # 1. Establish trusted ground truth baseline
        seed_res = process_observation(
            db_path=isolated_db,
            prefix_raw=baseline_info["prefix"],
            origin_asn_raw=baseline_info["origin_asn"],
            collector="baseline-seed",
            timestamp_raw="2000-01-01T00:00:00Z",
            scenario="baseline-seed",
            authorized_seed=True,
            actor="TEST_SEED",
        )
        assert len(seed_res["alerts"]) == 0

        # 2. Replay incident announcement
        obs_res = process_observation(
            db_path=isolated_db,
            prefix_raw=announcement["prefix"],
            origin_asn_raw=announcement["origin_asn"],
            collector=announcement.get("collector", "replay-archive"),
            timestamp_raw=announcement.get("timestamp"),
            scenario=inc_id,
        )

        alerts = obs_res["alerts"]

        # 3. Check anti-poisoning invariant
        with db_session(isolated_db) as conn:
            base_rows = conn.execute("SELECT prefix, origin_asn FROM baselines;").fetchall()
            base_dict = {r["prefix"]: r["origin_asn"] for r in base_rows}

        assert base_dict.get(baseline_info["prefix"]) == f"AS{baseline_info['origin_asn']}"
        if expected.get("alert_kind") == "SUBPREFIX_ANOMALY":
            assert announcement["prefix"] not in base_dict

        # 4. Check alert outcomes
        if expected.get("alert_kind") is None:
            # Control case: 0 alerts
            assert len(alerts) == 0
        else:
            assert len(alerts) >= 1
            assert alerts[0]["kind"] == expected["alert_kind"]
            assert alerts[0]["severity"] == expected["severity"]
            assert alerts[0]["observed_asn"] == f"AS{announcement['origin_asn']}"


def test_archival_mrt_replay_validation():
    from horaq.replay import run_full_historical_validation

    report = run_full_historical_validation()
    assert report is not None
    summary = report["summary"]
    assert summary["all_real_replays_detected"] is True
    assert summary["anti_poisoning_verified_across_all"] is True
    assert summary["withdrawal_and_recovery_verified"] is True
    assert summary["false_positives_on_benign_feed"] == 0
    assert summary["verified_real_replays_count"] >= 2
    assert summary["incomplete_data_evaluations_count"] >= 1
    assert summary["capability_boundary_controls_count"] >= 1
    assert summary["failed_verifications_count"] == 0

    # Explicit assertion of per-peer recovery from database results
    yt = next(inc for inc in report["incidents"] if inc.get("incident_id") == "INC-2008-02-24-YOUTUBE-PTCL")
    assert yt["recovery_tracking_verified"] is True
    assert yt["recovery_details"] is not None
    assert yt["recovery_details"]["verified"] is True
    assert yt["recovery_details"]["expected_withdrawn_peers"] == ["AS3333"]
    assert yt["recovery_details"]["actual_withdrawn_peers_in_resolved_alerts"] == ["AS3333"]
    assert len(yt["recovery_details"]["remaining_active_peers_in_db"]) == 10
    assert "AS3333" not in yt["recovery_details"]["remaining_active_peers_in_db"]
    assert yt["recovery_details"]["prematurely_resolved_alerts_count"] == 0


def test_replay_outcomes_data_driven_and_failure_detection(tmp_path):
    """Verify that replay outcomes are strictly computed from actual data and catch failures/incompletes."""
    from horaq.replay import ArchivalMrtReplayEngine

    db_path = str(tmp_path / "replay_test.db")
    init_db(db_path)
    engine = ArchivalMrtReplayEngine(db_path)

    # 1. Test Incomplete Data: fixture lacking pre_incident_snapshot
    incomplete_fixture = tmp_path / "incomplete_incident.json"
    incomplete_fixture.write_text(json.dumps({
        "incident_id": "INC-TEST-NO-SNAPSHOT",
        "source_url": "https://example.com/updates.gz",
        "incident_class": "SUBPREFIX_HIJACK",
        "ground_truth": {
            "target_prefix": "10.0.1.0/24",
            "parent_baseline_prefix": "10.0.0.0/16",
            "authorized_origin": "AS65001",
            "rogue_origin": "AS65002",
        },
        "records": [
            {
                "type": "ANNOUNCEMENT",
                "timestamp": 1200000000,
                "peer_as": "65003",
                "origin_asn": "65002",
                "prefixes": ["10.0.1.0/24"],
            }
        ],
    }), encoding="utf-8")

    res_incomplete = engine.replay_incident(incomplete_fixture)
    # Must be marked INCOMPLETE_DATA, never VERIFIED_REAL_REPLAY
    assert res_incomplete["verification_status"] == "INCOMPLETE_DATA"
    assert res_incomplete["detection_achieved"] is False

    # 2. Test Failed Verification: benign announcement that expected detection but didn't trigger
    failed_fixture = tmp_path / "failed_incident.json"
    failed_fixture.write_text(json.dumps({
        "incident_id": "INC-TEST-FAILED-DETECTION",
        "source_url": "https://example.com/updates.gz",
        "incident_class": "SUBPREFIX_HIJACK",
        "ground_truth": {
            "target_prefix": "10.0.1.0/24",
            "parent_baseline_prefix": "10.0.0.0/16",
            "authorized_origin": "AS65001",
            "rogue_origin": "AS65002",
        },
        "pre_incident_snapshot": {
            "source_archive": "https://example.com/bview.gz",
            "snapshot_timestamp": 1199999000,
            "records": [
                {
                    "peer_as": "65010",
                    "origin_asn": "65001",
                    "prefixes": ["10.0.0.0/16"],
                },
                {
                    "peer_as": "65011",
                    "origin_asn": "65001",
                    "prefixes": ["10.0.0.0/16"],
                },
            ],
        },
        "records": [
            # Announcement matches authorized parent origin (benign), so no alert generated
            {
                "type": "ANNOUNCEMENT",
                "timestamp": 1200000000,
                "peer_as": "65003",
                "origin_asn": "65001",
                "prefixes": ["10.0.0.0/16"],
            }
        ],
    }), encoding="utf-8")

    res_failed = engine.replay_incident(failed_fixture)
    # Because no alert was generated for this expected incident, status must be FAILED_VERIFICATION
    assert res_failed["verification_status"] == "FAILED_VERIFICATION"
    assert res_failed["detection_achieved"] is False


