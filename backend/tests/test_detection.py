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

