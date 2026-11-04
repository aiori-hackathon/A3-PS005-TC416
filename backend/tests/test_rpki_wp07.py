"""Tests for WP-07: Time-Correct and Semantically Precise RPKI Context."""

import pytest
import httpx
from unittest.mock import patch, AsyncMock, MagicMock

from horaq.rpki import (
    check_rpki_origin_validation,
    get_historical_rpki_context,
    RPKI_SEMANTICS_NOTE,
)


@pytest.mark.asyncio
async def test_live_rpki_labels_current_lookup_context():
    """Live RPKI query is explicitly labeled CURRENT_LOOKUP_CONTEXT with provider and timestamp."""
    mock_payload = {
        "status": "ok",
        "data": {
            "status": "valid",
            "validating_roas": [{"origin": "13335", "prefix": "1.1.1.0/24", "max_length": 24}],
        },
    }
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await check_rpki_origin_validation("1.1.1.0/24", "AS13335")
        assert res["status"] == "VALID"
        assert res["context_mode"] == "CURRENT_LOOKUP_CONTEXT"
        assert res["provider"] == "RIPEstat"
        assert res["lookup_time"] is not None
        assert "complete AS_PATH" in res["semantics_note"]


@pytest.mark.asyncio
async def test_error_and_timeout_never_labeled_as_unknown():
    """Network errors and timeouts return UNAVAILABLE, never UNKNOWN."""
    # Timeout test
    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.TimeoutException("Connection timed out")
        res = await check_rpki_origin_validation("1.1.1.0/24", "AS13335")
        assert res["status"] == "UNAVAILABLE"
        assert res["status"] != "UNKNOWN"

    # Non-200 HTTP response test
    mock_resp = MagicMock()
    mock_resp.status_code = 502
    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await check_rpki_origin_validation("1.1.1.0/24", "AS13335")
        assert res["status"] == "UNAVAILABLE"
        assert res["status"] != "UNKNOWN"


def test_historical_event_without_snapshot_reports_historically_unavailable():
    """Historical event without a time-matched snapshot reports HISTORICAL_RPKI_UNAVAILABLE."""
    res = get_historical_rpki_context(
        prefix="208.65.153.0/24",
        asn="AS36561",
        event_timestamp="2008-02-24T18:47:57Z",
        roa_snapshot=None,
    )
    assert res["status"] == "HISTORICAL_RPKI_UNAVAILABLE"
    assert res["context_mode"] == "HISTORICAL_REPLAY"
    assert "historical confusion" in res["details"]
    assert res["lookup_time"] is None


def test_snapshot_newer_than_event_is_rejected():
    """A ROA snapshot timestamped after the historical event is rejected to prevent time confusion."""
    future_snapshot = {
        "timestamp": "2026-01-01T00:00:00Z",
        "provider": "RIPE_NCC_ARCHIVE",
        "roas": [{"prefix": "208.65.153.0/24", "origin_asn": "36561", "max_length": 24}],
    }
    res = get_historical_rpki_context(
        prefix="208.65.153.0/24",
        asn="AS36561",
        event_timestamp="2008-02-24T18:47:57Z",
        roa_snapshot=future_snapshot,
    )
    assert res["status"] == "HISTORICAL_RPKI_UNAVAILABLE"
    assert "is newer than event timestamp" in res["details"]


def test_time_matched_historical_snapshot_evaluates_correctly():
    """A time-matched historical snapshot with timestamp <= event evaluates VALID/INVALID/UNKNOWN."""
    valid_snapshot = {
        "timestamp": "2008-02-01T00:00:00Z",
        "provider": "RIPE_NCC_HISTORICAL",
        "roas": [
            {"prefix": "208.65.152.0/22", "origin_asn": "36561", "max_length": 24},
        ],
    }

    # Legitimate origin AS36561
    res_valid = get_historical_rpki_context(
        prefix="208.65.153.0/24",
        asn="AS36561",
        event_timestamp="2008-02-24T18:47:57Z",
        roa_snapshot=valid_snapshot,
    )
    assert res_valid["status"] == "VALID"
    assert res_valid["context_mode"] == "HISTORICAL_TIME_MATCHED_SNAPSHOT"

    # Hijacking origin AS17557
    res_invalid = get_historical_rpki_context(
        prefix="208.65.153.0/24",
        asn="AS17557",
        event_timestamp="2008-02-24T18:47:57Z",
        roa_snapshot=valid_snapshot,
    )
    assert res_invalid["status"] == "INVALID"
    assert res_invalid["context_mode"] == "HISTORICAL_TIME_MATCHED_SNAPSHOT"


def test_semantics_note_explicitly_disclaims_full_as_path():
    """RPKI semantics note explicitly clarifies origin validation scope without claiming full path security."""
    assert "complete AS_PATH" in RPKI_SEMANTICS_NOTE
    assert "benign intent" in RPKI_SEMANTICS_NOTE

