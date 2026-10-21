"""Unit tests for RIPEstat RPKI origin-validation context fetching."""

import pytest
import httpx
from unittest.mock import patch, AsyncMock, MagicMock
from horaq.rpki import check_rpki_origin_validation


@pytest.mark.asyncio
async def test_rpki_valid_response():
    mock_payload = {
        "status": "ok",
        "data": {
            "status": "valid",
            "validating_roas": [
                {"origin": "13335", "prefix": "1.1.1.0/24", "max_length": 24, "validity": "valid"}
            ],
        },
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await check_rpki_origin_validation("1.1.1.0/24", "AS13335")
        assert res["status"] == "VALID"
        assert res["provider"] == "RIPEstat"
        assert len(res["validating_roas"]) == 1


@pytest.mark.asyncio
async def test_rpki_invalid_response():
    mock_payload = {
        "status": "ok",
        "data": {
            "status": "invalid",
            "validating_roas": [],
        },
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await check_rpki_origin_validation("1.1.1.0/24", "AS99999")
        assert res["status"] == "INVALID"


@pytest.mark.asyncio
async def test_rpki_timeout_yields_unavailable():
    # Strict specification: on timeout, return UNAVAILABLE without guessing
    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.TimeoutException("Timed out")
        res = await check_rpki_origin_validation("1.1.1.0/24", "AS13335")
        assert res["status"] == "UNAVAILABLE"
        assert "timed out" in res["details"].lower()


@pytest.mark.asyncio
async def test_rpki_http_error_yields_unavailable():
    mock_resp = MagicMock()
    mock_resp.status_code = 503

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await check_rpki_origin_validation("1.1.1.0/24", "AS13335")
        assert res["status"] == "UNAVAILABLE"
