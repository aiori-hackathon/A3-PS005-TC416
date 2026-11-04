"""Unit tests for WP-04: Forensic evidence binding to source observations.

Tests compliance with WP-04 requirements:
- New evidence record binds to exact database observation ID.
- Referenced observation exists in the observations table.
- Changing any provenance field (observation_id, rule_version, peer_session) invalidates evidence digest.
- Existing v1.0.0 evidence records remain verifiable.
- Verifier CLI checks schema version, provenance metadata, and post-quantum digital signature.
"""

import json
import os
import subprocess
import sys
import tempfile
import pytest

from horaq.crypto import is_mldsa_available, sign_data
from horaq.database import db_session, init_db
from horaq.detection import process_observation
from horaq.evidence import canonicalize_json, compute_sha256, create_evidence_payload, verify_evidence_hash


@pytest.fixture
def test_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_evidence_payload_binds_observation_id_and_provenance(test_db):
    """Generated alert evidence record must contain the database observation_id and provenance fields."""
    # 1. Establish parent baseline
    process_observation(
        db_path=test_db,
        prefix_raw="10.0.0.0/8",
        origin_asn_raw="AS1000",
        authorized_seed=True,
    )

    # 2. Inject anomalous subprefix
    r = process_observation(
        db_path=test_db,
        prefix_raw="10.1.0.0/16",
        origin_asn_raw="AS2000",
        collector="rrc00",
        peer_ip="193.0.0.5",
        peer_as="9999",
    )

    assert r["alerts_count"] == 1
    alert = r["alerts"][0]
    ev = alert["evidence"]
    record = ev["record"]

    # Provenance assertions
    assert record["schema_version"] == "1.1.0"
    assert record["rule_version"] == "2.0.0"
    assert record["timestamp_semantics"] == "source_observation_time"
    assert record["observation_id"] is not None
    assert record["observation_id"] in record["supporting_observation_ids"]
    assert record["peer_session"] == "rrc00:193.0.0.5"
    assert record["peer_as"] == "AS9999"
    assert "trust_statement" in record

    # Verify that the referenced observation actually exists in the SQLite database
    with db_session(test_db) as conn:
        obs = conn.execute("SELECT * FROM observations WHERE id = ?;", (record["observation_id"],)).fetchone()
        assert obs is not None
        assert obs["prefix"] == "10.1.0.0/16"
        assert obs["origin_asn"] == "AS2000"
        assert obs["peer_session"] == "rrc00:193.0.0.5"


def test_tampering_any_provenance_field_invalidates_hash(test_db):
    """Mutating observation_id, rule_version, or peer_session must fail verification."""
    payload, original_hash = create_evidence_payload(
        alert_id="alert-test-01",
        prefix="198.51.100.0/24",
        observed_asn="AS65000",
        baseline_asn="AS64496",
        parent_prefix=None,
        rule_name="ORIGIN_AS_DIFFERENCE_RULE",
        severity="HIGH",
        explanation="Test explanation",
        timestamp="2026-11-04T12:00:00Z",
        observation_id=42,
        rule_version="2.0.0",
        peer_session="rrc00:193.0.0.1",
    )

    is_valid, _ = verify_evidence_hash(payload, original_hash)
    assert is_valid is True

    # 1. Tamper observation_id
    tampered_obs = dict(payload)
    tampered_obs["observation_id"] = 9999
    valid_obs, _ = verify_evidence_hash(tampered_obs, original_hash)
    assert valid_obs is False, "Mutating observation_id must invalidate hash"

    # 2. Tamper rule_version
    tampered_rule = dict(payload)
    tampered_rule["rule_version"] = "1.0.0"
    valid_rule, _ = verify_evidence_hash(tampered_rule, original_hash)
    assert valid_rule is False, "Mutating rule_version must invalidate hash"

    # 3. Tamper peer_session
    tampered_sess = dict(payload)
    tampered_sess["peer_session"] = "rrc00:fake-session"
    valid_sess, _ = verify_evidence_hash(tampered_sess, original_hash)
    assert valid_sess is False, "Mutating peer_session must invalidate hash"


def test_existing_v100_sample_verifies_with_standalone_cli():
    """Verify that audit/sample_evidence_signed.json (schema 1.0.0) remains fully verifiable."""
    verifier_path = os.path.join(os.path.dirname(__file__), "..", "..", "verify_evidence.py")
    sample_path = os.path.join(os.path.dirname(__file__), "..", "..", "audit", "sample_evidence_signed.json")

    cmd = [sys.executable, verifier_path, sample_path]
    r = subprocess.run(cmd, capture_output=True, text=True)
    assert r.returncode == 0
    assert "FINAL VERDICT: [AUTHENTIC]" in r.stdout
    assert "Schema Version          : 1.0.0" in r.stdout


def test_new_v110_signed_record_verifies_with_standalone_cli():
    """Verify newly constructed v1.1.0 evidence record verifies with standalone CLI."""
    if not is_mldsa_available():
        pytest.skip("ML-DSA provider not available on this platform")

    payload, digest = create_evidence_payload(
        alert_id="alert-v110-prov",
        prefix="203.0.113.0/24",
        observed_asn="AS65555",
        baseline_asn="AS65000",
        parent_prefix=None,
        rule_name="ORIGIN_AS_DIFFERENCE_RULE",
        severity="HIGH",
        explanation="WP-04 provenance test",
        timestamp="2026-11-04T12:00:00Z",
        observation_id=101,
        supporting_observation_ids=[101],
        peer_as="AS65555",
        peer_session="rrc00:193.0.0.99",
    )

    canon_bytes = canonicalize_json(payload)
    sig_b64, pub_b64 = sign_data(canon_bytes)

    evidence_doc = {
        "id": "ev-v110-test",
        "alert_id": "alert-v110-prov",
        "schema_version": "1.1.0",
        "record_hash": digest,
        "algorithm": "ML-DSA-65",
        "signature": sig_b64,
        "public_key": pub_b64,
        "signer_status": "SIGNED",
        "created_at": "2026-11-04T12:00:00Z",
        "record": payload,
    }

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(evidence_doc, f)
        doc_path = f.name

    try:
        verifier_path = os.path.join(os.path.dirname(__file__), "..", "..", "verify_evidence.py")
        cmd = [sys.executable, verifier_path, doc_path]
        r = subprocess.run(cmd, capture_output=True, text=True)
        assert r.returncode == 0
        assert "FINAL VERDICT: [AUTHENTIC]" in r.stdout
        assert "Schema Version          : 1.1.0" in r.stdout
        assert "Bound Observation ID(s) : [101]" in r.stdout
        assert "Rule Version            : 2.0.0" in r.stdout
    finally:
        if os.path.exists(doc_path):
            os.remove(doc_path)

