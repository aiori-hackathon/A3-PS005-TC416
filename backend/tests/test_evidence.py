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


def test_rfc8785_canonicalization_compliance():
    """Verify compliance with RFC 8785 JSON Canonicalization Scheme (JCS)."""
    # 1. UTF-16 code unit ordering for property names
    d = {"\u00e9": 1, "e": 2, "a": 3}
    # In UTF-16 code units: 'a' (0x61) < 'e' (0x65) < '\u00e9' (0xE9)
    canon = canonicalize_json(d)
    assert canon == b'{"a":3,"e":2,"\xc3\xa9":1}'

    # 2. Unicode characters preserved in UTF-8 without unnecessary escapes
    d_unicode = {"text": "BGP-Monitoring-\u2014-Safe"}
    assert canonicalize_json(d_unicode) == b'{"text":"BGP-Monitoring-\xe2\x80\x94-Safe"}'

    # 3. Compact delimiters without any whitespace
    d_nested = {"arr": [1, 2, {"k": "v"}], "flag": True, "empty": None}
    assert canonicalize_json(d_nested) == b'{"arr":[1,2,{"k":"v"}],"empty":null,"flag":true}'


def test_rfc8785_utf16_surrogate_pair_ordering_vs_codepoints():
    """Test non-BMP supplementary code points where UTF-16 ordering differs from Unicode code point order."""
    # U+FFFF has code point 65535, UTF-16 code unit [0xFFFF]
    # U+1F600 has code point 128512, UTF-16 surrogate pair [0xD83D, 0xDE00]
    # In Unicode code point sort: U+FFFF (65535) comes before U+1F600 (128512)
    # In RFC 8785 UTF-16 code unit sort: 0xD83D comes before 0xFFFF!
    d = {"\uffff": 1, "\U0001f600": 2}
    canon = canonicalize_json(d)
    # The UTF-8 encoded byte sequence for U+1F600 is \xf0\x9f\x98\x80 and for U+FFFF is \xef\xbf\xbf
    assert canon == b'{"\xf0\x9f\x98\x80":2,"\xef\xbf\xbf":1}'


def test_rfc8785_number_and_float_serialization():
    """Test RFC 8785 Section 3.2.2 number serialization: negative zero, float formatting, and domain."""
    import math

    # Negative zero must be serialized as 0
    d_neg_zero = {"zero": -0.0}
    assert canonicalize_json(d_neg_zero) == b'{"zero":0}'

    # Integers and safe integers
    d_nums = {"max_safe": 9007199254740991, "neg_safe": -9007199254740991}
    assert canonicalize_json(d_nums) == b'{"max_safe":9007199254740991,"neg_safe":-9007199254740991}'

    # NaN and Infinity must be rejected under RFC 8785
    import pytest
    with pytest.raises(Exception):
        canonicalize_json({"val": float("nan")})

    with pytest.raises(Exception):
        canonicalize_json({"val": float("inf")})


def test_backend_and_independent_verifier_byte_parity():
    """Verify that backend horaq.evidence and verify_evidence produce byte-identical canonical JSON."""
    import sys
    import os
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    import verify_evidence

    payload = {
        "alert_id": "alert-test-parity",
        "prefix": "192.0.2.0/24",
        "observed_asn": "AS64511",
        "baseline_asn": "AS64496",
        "float_val": -0.0,
        "nested": {"z": 1, "a": 2, "\U0001f600": "emoji"},
        "tags": ["bgp", "incident", None, True, False],
    }

    backend_bytes = canonicalize_json(payload)
    verifier_bytes = verify_evidence.canonicalize_json(payload)

    assert backend_bytes == verifier_bytes
    assert compute_sha256(backend_bytes) == verify_evidence.compute_sha256(verifier_bytes)


def test_unsigned_evidence_record_cannot_be_authentic(tmp_path):
    """Verify that unsigned evidence files cannot receive an AUTHENTIC verdict, exiting with code 2."""
    import sys
    import os
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    import verify_evidence

    record = {"alert_id": "alert-unsigned-01", "prefix": "198.51.100.0/24", "observed_asn": "AS65530"}
    canon = verify_evidence.canonicalize_json(record)
    digest = verify_evidence.compute_sha256(canon)

    evidence_file = str(tmp_path / "unsigned_evidence.json")
    with open(evidence_file, "w", encoding="utf-8") as f:
        json.dump({"record": record, "record_hash": digest}, f)

    # By default, unsigned evidence record must return verdict UNSIGNED and exit code 2
    res = verify_evidence.verify_evidence_file(evidence_file)
    assert res.verdict == "UNSIGNED"
    assert res.exit_code == 2
    assert bool(res) is False  # Cannot establish authenticity

    # Only when explicitly allowed with allow_unsigned=True does exit code become 0
    res_allowed = verify_evidence.verify_evidence_file(evidence_file, allow_unsigned=True)
    assert res_allowed.verdict == "UNSIGNED"
    assert res_allowed.exit_code == 0


def test_tampered_unsigned_evidence_record_rejected(tmp_path):
    """Verify that tampered unsigned records are rejected as COMPROMISED with exit code 1."""
    import sys
    import os
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    import verify_evidence

    record = {"alert_id": "alert-unsigned-02", "prefix": "198.51.100.0/24", "observed_asn": "AS65530"}
    canon = verify_evidence.canonicalize_json(record)
    digest = verify_evidence.compute_sha256(canon)

    evidence_file = str(tmp_path / "unsigned_tamper_test.json")
    with open(evidence_file, "w", encoding="utf-8") as f:
        json.dump({"record": record, "record_hash": digest}, f)

    # Simulating tamper must detect hash mismatch and yield COMPROMISED (exit code 1)
    res = verify_evidence.verify_evidence_file(evidence_file, simulate_tamper=True)
    assert res.verdict == "COMPROMISED"
    assert res.exit_code == 1


def test_missing_expected_hash_and_signature_incomplete(tmp_path):
    """Verify that an unsigned record with no comparison hash yields INCOMPLETE (exit code 1)."""
    import sys
    import os
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    import verify_evidence

    record = {"alert_id": "alert-incomplete-01", "prefix": "203.0.113.0/24"}
    evidence_file = str(tmp_path / "incomplete_evidence.json")
    with open(evidence_file, "w", encoding="utf-8") as f:
        json.dump({"record": record}, f)

    res = verify_evidence.verify_evidence_file(evidence_file)
    assert res.verdict == "INCOMPLETE"
    assert res.exit_code == 1


def test_signed_evidence_missing_public_key_or_algorithm(tmp_path):
    """Verify that signed records missing a public key or algorithm metadata yield INCOMPLETE."""
    import sys
    import os
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    import verify_evidence

    record = {"alert_id": "alert-sig-incomplete", "prefix": "203.0.113.0/24"}
    canon = verify_evidence.canonicalize_json(record)
    digest = verify_evidence.compute_sha256(canon)

    # Missing public key
    f1 = str(tmp_path / "missing_pk.json")
    with open(f1, "w", encoding="utf-8") as f:
        json.dump({"record": record, "record_hash": digest, "signature": "AAAA", "algorithm": "ML-DSA-65"}, f)
    res1 = verify_evidence.verify_evidence_file(f1)
    assert res1.verdict == "INCOMPLETE"
    assert res1.exit_code == 1

    # Missing algorithm metadata
    f2 = str(tmp_path / "missing_algo.json")
    with open(f2, "w", encoding="utf-8") as f:
        json.dump({"record": record, "record_hash": digest, "signature": "AAAA", "public_key": "BBBB"}, f)
    res2 = verify_evidence.verify_evidence_file(f2)
    assert res2.verdict == "INCOMPLETE"
    assert res2.exit_code == 1


def test_signed_evidence_unsupported_algorithm(tmp_path):
    """Verify that signed records with unsupported algorithm yield UNSUPPORTED (exit code 1)."""
    import sys
    import os
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    import verify_evidence

    record = {"alert_id": "alert-unsupported-algo", "prefix": "203.0.113.0/24"}
    canon = verify_evidence.canonicalize_json(record)
    digest = verify_evidence.compute_sha256(canon)

    test_file_path = str(tmp_path / "unsupported_algo.json")
    with open(test_file_path, "w", encoding="utf-8") as fh:
        json.dump({
            "record": record,
            "record_hash": digest,
            "signature": "AAAA",
            "public_key": "BBBB",
            "algorithm": "RSA-4096-INCOMPATIBLE"
        }, fh)
    res = verify_evidence.verify_evidence_file(test_file_path)
    assert res.verdict == "UNSUPPORTED"
    assert res.exit_code == 1



def test_authentic_sample_evidence_file_verified():
    """Verify that audit/sample_evidence_signed.json yields AUTHENTIC (exit code 0)."""
    import sys
    import os
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    import verify_evidence

    sample_path = os.path.join(repo_root, "audit", "sample_evidence_signed.json")
    assert os.path.exists(sample_path)

    res = verify_evidence.verify_evidence_file(sample_path)
    assert res.verdict == "AUTHENTIC"
    assert res.exit_code == 0
    assert bool(res) is True


def test_tampered_sample_evidence_file_rejected():
    """Verify that audit/sample_evidence_signed.json with --tamper yields COMPROMISED (exit code 1)."""
    import sys
    import os
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    import verify_evidence

    sample_path = os.path.join(repo_root, "audit", "sample_evidence_signed.json")
    assert os.path.exists(sample_path)

    res = verify_evidence.verify_evidence_file(sample_path, simulate_tamper=True)
    assert res.verdict == "COMPROMISED"
    assert res.exit_code == 1
    assert bool(res) is False


