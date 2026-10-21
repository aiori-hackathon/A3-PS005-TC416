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
