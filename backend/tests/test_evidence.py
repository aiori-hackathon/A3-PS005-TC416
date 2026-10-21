"""Unit tests for Evidence record generation, canonicalization, and SHA-256 hashing."""

import json
from horaq.evidence import (
    canonicalize_json,
    compute_sha256,
    create_evidence_payload,
    verify_evidence_hash,
)


def test_canonicalize_json_sorted_keys():
    d1 = {"b": 2, "a": 1, "nested": {"z": 26, "y": 25}}
    d2 = {"nested": {"y": 25, "z": 26}, "a": 1, "b": 2}
    # Regardless of dictionary insertion order, canonical output must match byte-for-byte
    assert canonicalize_json(d1) == canonicalize_json(d2)
    # Check compact delimiters without space
    assert b'{"a":1,"b":2,"nested":{"y":25,"z":26}}' == canonicalize_json(d1)


def test_create_and_verify_evidence_hash():
    record, digest = create_evidence_payload(
        alert_id="alert-1234",
        prefix="192.0.2.0/24",
        observed_asn="AS64511",
        baseline_asn="AS64496",
        parent_prefix=None,
        rule_name="ORIGIN_AS_DIFFERENCE_RULE",
        severity="HIGH",
        explanation="Origin changed from AS64496 to AS64511",
        timestamp="2026-10-21T07:00:00.000000Z",
        collector="test-collector",
    )

    assert isinstance(digest, str)
    assert len(digest) == 64  # SHA-256 hex length

    # Verification must succeed for intact record
    is_valid, computed = verify_evidence_hash(record, digest)
    assert is_valid is True
    assert computed == digest


def test_verify_evidence_hash_detects_tampering():
    record, digest = create_evidence_payload(
        alert_id="alert-1234",
        prefix="192.0.2.0/24",
        observed_asn="AS64511",
        baseline_asn="AS64496",
        parent_prefix=None,
        rule_name="ORIGIN_AS_DIFFERENCE_RULE",
        severity="HIGH",
        explanation="Original explanation",
        timestamp="2026-10-21T07:00:00.000000Z",
    )

    # Tamper with the evidence record (e.g. change severity or ASN)
    tampered_record = dict(record)
    tampered_record["severity"] = "LOW"

    is_valid, computed = verify_evidence_hash(tampered_record, digest)
    assert is_valid is False
    assert computed != digest
