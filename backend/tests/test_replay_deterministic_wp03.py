"""Unit tests for WP-03: Deterministic and time-honest archival replay.

Tests compliance with WP-03 requirements:
- Missing timestamps reject execution as INCOMPLETE_DATA (never falls back to runtime clock).
- Malformed timestamps reject execution explicitly.
- Out-of-order input is rejected in strict mode.
- Non-strict mode deterministically reorders using stable tie-breaker (original index).
- Fixture checksum changes if fixture content changes.
- Repeated runs produce identical detection and recovery outcomes.
"""

import copy
import json
import os
import tempfile
from pathlib import Path
import pytest

from horaq.database import init_db
from horaq.replay import ArchivalMrtReplayEngine, compute_file_sha256, validate_source_timestamp


@pytest.fixture
def test_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_validate_source_timestamp_unit():
    """Verify timestamp validator accepts valid epochs and rejects None, invalid strings, and out-of-range."""
    assert validate_source_timestamp(1203878877) == 1203878877
    assert validate_source_timestamp("1648469200") == 1648469200
    assert validate_source_timestamp(None) is None
    assert validate_source_timestamp("not-a-number") is None
    assert validate_source_timestamp(-100) is None
    assert validate_source_timestamp(5000000000) is None  # Beyond year 2100


def test_missing_timestamp_rejected_as_incomplete(test_db):
    """Archival record with missing timestamp returns INCOMPLETE_DATA and never uses current time."""
    engine = ArchivalMrtReplayEngine(test_db)
    fixtures_dir = Path(__file__).resolve().parent / "fixtures" / "mrt_incidents"
    yt_fixture = fixtures_dir / "youtube_ptcl_2008_mrt_sample.json"

    with open(yt_fixture, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Corrupt one record by removing its timestamp
    corrupted_data = copy.deepcopy(data)
    del corrupted_data["records"][2]["timestamp"]

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
        json.dump(corrupted_data, tmp)
        tmp_path = Path(tmp.name)

    try:
        res = engine.replay_incident(tmp_path)
        assert res["verification_status"] == "INCOMPLETE_DATA"
        assert "missing or malformed timestamp" in res["rejection_reason"].lower()
        assert res["records_replayed_count"] == 0
    finally:
        if tmp_path.exists():
            os.remove(tmp_path)


def test_malformed_timestamp_rejected(test_db):
    """Archival record with string/negative timestamp returns INCOMPLETE_DATA."""
    engine = ArchivalMrtReplayEngine(test_db)
    fixtures_dir = Path(__file__).resolve().parent / "fixtures" / "mrt_incidents"
    yt_fixture = fixtures_dir / "youtube_ptcl_2008_mrt_sample.json"

    with open(yt_fixture, "r", encoding="utf-8") as f:
        data = json.load(f)

    corrupted_data = copy.deepcopy(data)
    corrupted_data["records"][1]["timestamp"] = "corrupted_timestamp_string"

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
        json.dump(corrupted_data, tmp)
        tmp_path = Path(tmp.name)

    try:
        res = engine.replay_incident(tmp_path)
        assert res["verification_status"] == "INCOMPLETE_DATA"
        assert res["records_replayed_count"] == 0
    finally:
        if tmp_path.exists():
            os.remove(tmp_path)


def test_out_of_order_rejected_in_strict_mode(test_db):
    """Out-of-order records are rejected in strict mode with INVALID_INPUT."""
    engine = ArchivalMrtReplayEngine(test_db)
    fixtures_dir = Path(__file__).resolve().parent / "fixtures" / "mrt_incidents"
    yt_fixture = fixtures_dir / "youtube_ptcl_2008_mrt_sample.json"

    with open(yt_fixture, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Invert order: place record 2 (ts: 1203878878) before record 0 (ts: 1203878877)
    reordered_data = copy.deepcopy(data)
    reordered_data["records"][0], reordered_data["records"][2] = (
        reordered_data["records"][2],
        reordered_data["records"][0],
    )

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
        json.dump(reordered_data, tmp)
        tmp_path = Path(tmp.name)

    try:
        # Strict mode: must be rejected
        res_strict = engine.replay_incident(tmp_path, strict=True)
        assert res_strict["verification_status"] == "INVALID_INPUT"
        assert "not in chronological order" in res_strict["rejection_reason"]

        # Non-strict mode: sorts deterministically and marks reordering_applied
        fd, db_path2 = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        init_db(db_path2)
        try:
            engine2 = ArchivalMrtReplayEngine(db_path2)
            res_sort = engine2.replay_incident(tmp_path, strict=False)
            assert res_sort["verification_status"] == "VERIFIED_REAL_REPLAY"
            assert res_sort["reordering_applied"] is True
        finally:
            if os.path.exists(db_path2):
                os.remove(db_path2)
    finally:
        if tmp_path.exists():
            os.remove(tmp_path)


def test_checksum_changes_when_bytes_change():
    """Verify compute_file_sha256 reflects any modification in the dataset file."""
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp1:
        tmp1.write('{"data": 1}')
        path1 = Path(tmp1.name)

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp2:
        tmp2.write('{"data": 2}')
        path2 = Path(tmp2.name)

    try:
        h1 = compute_file_sha256(path1)
        h2 = compute_file_sha256(path2)
        assert h1 != h2
    finally:
        if path1.exists():
            os.remove(path1)
        if path2.exists():
            os.remove(path2)


def test_repeated_replay_determinism():
    """Running identical fixture twice yields identical detection, alert counts, and digest."""
    fixtures_dir = Path(__file__).resolve().parent / "fixtures" / "mrt_incidents"
    yt_fixture = fixtures_dir / "youtube_ptcl_2008_mrt_sample.json"

    fd1, db1 = tempfile.mkstemp(suffix=".db")
    os.close(fd1)
    init_db(db1)

    fd2, db2 = tempfile.mkstemp(suffix=".db")
    os.close(fd2)
    init_db(db2)

    try:
        e1 = ArchivalMrtReplayEngine(db1)
        r1 = e1.replay_incident(yt_fixture)

        e2 = ArchivalMrtReplayEngine(db2)
        r2 = e2.replay_incident(yt_fixture)

        assert r1["verification_status"] == r2["verification_status"]
        assert r1["dataset_sha256"] == r2["dataset_sha256"]
        assert r1["alerts_count"] == r2["alerts_count"]
        assert r1["withdrawals_processed"] == r2["withdrawals_processed"]
        assert r1["resolved_alerts_count"] == r2["resolved_alerts_count"]
        assert r1["detection_delay_seconds"] == r2["detection_delay_seconds"]
        assert r1["source_time_interval"] == r2["source_time_interval"]
    finally:
        if os.path.exists(db1):
            os.remove(db1)
        if os.path.exists(db2):
            os.remove(db2)
