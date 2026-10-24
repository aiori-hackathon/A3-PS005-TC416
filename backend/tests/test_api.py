"""Integration tests for FastAPI endpoints."""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient

from horaq.config import settings
from horaq.database import init_db
from horaq.main import app


@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    monkeypatch.setattr(settings, "database_path", path)
    yield
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


@pytest.fixture
def client():
    return TestClient(app)


def test_root_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["team"] == "A3-PS005-TC416"


def test_overview_endpoint(client):
    resp = client.get("/api/v1/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "tracked_routes" in data
    assert "total_observations" in data
    assert "total_alerts" in data
    assert "crypto_status" in data


def test_post_observation_valid(client):
    payload = {
        "prefix": "192.0.2.0/24",
        "origin_asn": 64496,
        "collector": "test-suite",
    }
    resp = client.post("/api/v1/observations", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "ACCEPTED"
    assert data["prefix"] == "192.0.2.0/24"
    assert data["origin_asn"] == "AS64496"


def test_post_observation_invalid_prefix(client):
    payload = {
        "prefix": "invalid-prefix",
        "origin_asn": 64496,
    }
    resp = client.post("/api/v1/observations", json=payload)
    assert resp.status_code == 422


def test_post_observation_invalid_asn(client):
    payload = {
        "prefix": "192.0.2.0/24",
        "origin_asn": "AS0",  # AS0 rejected
    }
    resp = client.post("/api/v1/observations", json=payload)
    assert resp.status_code == 422


def test_run_synthetic_scenarios(client):
    # 1. Run baseline scenario
    r1 = client.post("/api/v1/scenarios/baseline")
    assert r1.status_code == 200
    assert r1.json()["alerts_generated"] == 0

    # Verify route exists
    routes_resp = client.get("/api/v1/routes")
    assert routes_resp.status_code == 200
    assert routes_resp.json()["total"] >= 1

    # 2. Run origin-change scenario
    r2 = client.post("/api/v1/scenarios/origin-change")
    assert r2.status_code == 200
    assert r2.json()["alerts_generated"] == 1

    # 3. Run subprefix scenario
    r3 = client.post("/api/v1/scenarios/subprefix")
    assert r3.status_code == 200
    assert r3.json()["alerts_generated"] == 1

    # Verify alerts list
    alerts_resp = client.get("/api/v1/alerts")
    assert alerts_resp.status_code == 200
    assert alerts_resp.json()["total"] >= 2


def test_evidence_verify_hash_endpoint(client):
    # Establish an anomaly to generate evidence
    client.post("/api/v1/scenarios/baseline")
    r = client.post("/api/v1/scenarios/origin-change")
    alert = r.json()["result"]["alerts"][0]
    ev = alert["evidence"]

    verify_payload = {
        "record": ev["record"],
        "expected_hash": ev["hash"],
    }
    resp = client.post("/api/v1/evidence/verify-hash", json=verify_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert data["integrity_verified"] is True


def test_crypto_public_key_endpoint(client):
    resp = client.get("/api/v1/crypto/public-key")
    if resp.status_code == 503:
        pytest.skip("ML-DSA provider not available")
    assert resp.status_code == 200
    data = resp.json()
    assert data["algorithm"] == "ML-DSA-65"
    assert "public_key" in data
    assert len(data["public_key"]) > 100
    assert "fingerprint" in data
    assert len(data["fingerprint"]) == 64

