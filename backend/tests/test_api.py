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


def test_collector_status_endpoint(client):
    resp = client.get("/api/v1/collector/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "enabled" in data
    assert "connected" in data
    assert "url" in data
    assert "messages_received" in data


def test_demo_mode_restricts_arbitrary_observation_submission(client, monkeypatch):
    """Verify that when demo_mode is enabled, arbitrary observation submission is restricted."""
    from horaq.config import settings

    monkeypatch.setattr(settings, "demo_mode", True)
    monkeypatch.setattr(settings, "admin_token", "test-admin-secret")

    payload = {"prefix": "192.0.2.0/24", "origin_asn": 64496}

    # 1. Submission without token is rejected with 403 Forbidden
    resp = client.post("/api/v1/observations", json=payload)
    assert resp.status_code == 403
    assert "restricted in Public Evaluator Demo Mode" in resp.json()["detail"]

    # 2. Submission with valid X-Admin-Token header succeeds
    resp_authed = client.post("/api/v1/observations", json=payload, headers={"X-Admin-Token": "test-admin-secret"})
    assert resp_authed.status_code == 201


def test_demo_mode_safe_reset_protects_database(client, monkeypatch):
    """Verify that in demo mode, reset safely preserves and seeds baseline routes rather than wiping clean."""
    from horaq.config import settings

    monkeypatch.setattr(settings, "demo_mode", True)

    resp = client.post("/api/v1/scenarios/reset")
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenario"] == "reset"
    assert data["success"] is True
    assert "safely reset to prepared baseline" in data["message"]

    # Verify routes exist after safe demo reset
    routes_resp = client.get("/api/v1/routes")
    assert routes_resp.status_code == 200
    assert routes_resp.json()["total"] >= 1


def test_demo_mode_seed_demo_protects_live_observations(client, monkeypatch):
    """Verify that in demo mode, seed-demo preserves real live BGP observations."""
    from horaq.config import settings
    from horaq.database import db_session

    # Seed a simulated live observation (scenario is None)
    with db_session(settings.database_path) as conn:
        with conn:
            conn.execute(
                "INSERT INTO observations (prefix, origin_asn, collector, observed_at, scenario, raw_metadata, created_at) "
                "VALUES ('193.0.0.0/21', 'AS3333', 'ripe-ris-live', '2026-10-25T12:00:00Z', NULL, '{}', '2026-10-25T12:00:00Z');"
            )

    monkeypatch.setattr(settings, "demo_mode", True)

    resp = client.post("/api/v1/scenarios/seed-demo")
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Confirm that the live observation was NOT deleted by seed-demo
    with db_session(settings.database_path) as conn:
        row = conn.execute("SELECT prefix FROM observations WHERE prefix = '193.0.0.0/21';").fetchone()
        assert row is not None, "Live BGP observation was wiped by unauthenticated seed-demo in demo mode!"


def test_api_unauthorized_seed_escalation_blocked(client, monkeypatch):
    """P1 Regression Test: Verify /api/v1/observations cannot promote baseline via scenario/metadata."""
    from horaq.config import settings

    # Ensure arbitrary observation submission is allowed (demo_mode=False)
    monkeypatch.setattr(settings, "demo_mode", False)

    # Caller submits observation with trusted_seed flag and seed scenario
    resp = client.post(
        "/api/v1/observations",
        json={
            "prefix": "198.51.200.0/24",
            "origin_asn": 64515,
            "scenario": "seed-my-baseline",
            "metadata": {"trusted_seed": True, "authorized": True},
        },
    )
    assert resp.status_code == 201

    # Check baseline status in routes: MUST BE CANDIDATE, NOT PROMOTED
    routes_resp = client.get("/api/v1/routes?search=198.51.200.0")
    assert routes_resp.status_code == 200
    items = routes_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["status"] == "CANDIDATE", "Observation endpoint allowed caller to establish PROMOTED baseline!"


def test_api_authorized_baseline_seeding_and_history(client, monkeypatch):
    """P1 Regression Test: Verify /api/v1/baselines/seed and history endpoints."""
    from horaq.config import settings

    monkeypatch.setattr(settings, "demo_mode", False)

    # 1. Authorize baseline seed via dedicated endpoint
    seed_resp = client.post(
        "/api/v1/baselines/seed",
        json={
            "prefix": "203.0.120.0/24",
            "origin_asn": "AS64520",
            "reason": "Authorized ISP upstream allocation",
        },
    )
    assert seed_resp.status_code == 201
    assert seed_resp.json()["status"] == "PROMOTED"

    # 2. Verify route is PROMOTED
    route_resp = client.get("/api/v1/routes?search=203.0.120.0")
    assert route_resp.status_code == 200
    assert route_resp.json()["items"][0]["status"] == "PROMOTED"

    # 3. Verify history endpoint
    hist_resp = client.get("/api/v1/baselines/history?prefix=203.0.120.0/24")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["total"] >= 1
    assert hist_data["items"][0]["transition_type"] == "AUTHORIZED_SEED"

    # 4. Verify route-specific history endpoint
    pfx_hist = client.get("/api/v1/routes/203.0.120.0/24/history")
    assert pfx_hist.status_code == 200
    assert pfx_hist.json()["total"] >= 1


def test_api_authorized_seeding_requires_auth_in_demo_mode(client, monkeypatch):
    """P1 Regression Test: Verify authorized baseline seeding requires credentials in demo mode."""
    from horaq.config import settings

    monkeypatch.setattr(settings, "demo_mode", True)
    monkeypatch.setattr(settings, "admin_token", "secret-test-token")

    # Unauthenticated attempt fails with 403
    unauth_resp = client.post(
        "/api/v1/baselines/seed",
        json={"prefix": "192.0.2.0/24", "origin_asn": "AS64496"},
    )
    assert unauth_resp.status_code == 403

    # Authenticated attempt succeeds
    auth_resp = client.post(
        "/api/v1/baselines/seed",
        json={"prefix": "192.0.2.0/24", "origin_asn": "AS64496"},
        headers={"X-Admin-Token": "secret-test-token"},
    )
    assert auth_resp.status_code == 201
    assert auth_resp.json()["status"] == "PROMOTED"


def test_api_post_withdrawal_endpoint(client, monkeypatch):
    """Verify POST /api/v1/withdrawals resolves matching active alert."""
    from horaq.config import settings

    monkeypatch.setattr(settings, "demo_mode", False)

    # 1. Seed baseline
    client.post(
        "/api/v1/baselines/seed",
        json={"prefix": "192.0.2.0/24", "origin_asn": "AS64496"},
    )

    # 2. Inject subprefix anomaly
    obs_resp = client.post(
        "/api/v1/observations",
        json={
            "prefix": "192.0.2.128/25",
            "origin_asn": 64500,
            "metadata": {"peer_as": "AS64500"},
        },
    )
    assert obs_resp.status_code == 201
    assert obs_resp.json()["alerts_count"] == 1

    # 3. Post withdrawal from peer AS64500
    w_resp = client.post(
        "/api/v1/withdrawals",
        json={
            "prefix": "192.0.2.128/25",
            "peer_as": "AS64500",
        },
    )
    assert w_resp.status_code == 200
    data = w_resp.json()
    assert len(data["resolved_alerts"]) == 1
    assert data["resolved_alerts"][0]["status"] == "RESOLVED"
    assert data["resolved_alerts"][0]["recovery_status"] == "CONFIRMED"

    # 4. Confirm no active alerts remain on this prefix
    alerts_resp = client.get("/api/v1/alerts?status=ACTIVE")
    active = [a for a in alerts_resp.json()["items"] if a["prefix"] == "192.0.2.128/25"]
    assert len(active) == 0


def test_api_withdrawal_recovery_scenario(client, monkeypatch):
    """Verify /api/v1/scenarios/withdrawal-recovery executes full recovery lifecycle."""
    from horaq.config import settings

    monkeypatch.setattr(settings, "demo_mode", False)

    # Run withdrawal-recovery scenario
    sc_resp = client.post("/api/v1/scenarios/withdrawal-recovery")
    assert sc_resp.status_code == 200
    sc_data = sc_resp.json()
    assert sc_data["scenario"] == "withdrawal-recovery"
    assert sc_data["success"] is True
    assert sc_data["alerts_resolved"] >= 1






