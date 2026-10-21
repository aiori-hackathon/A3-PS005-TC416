"""Evidence records and integrity verification for HORA-Q.

Adheres to Document 18:
- Canonical JSON serialization (UTF-8, sorted keys, compact delimiters)
- SHA-256 hashing for content integrity
- Separation between integrity hash and cryptographic signature
"""

import hashlib
import json
from typing import Any, Dict, Tuple


SCHEMA_VERSION = "1.0.0"


def canonicalize_json(data: Dict[str, Any]) -> bytes:
    """Serialize dictionary to deterministic canonical JSON bytes.

    Uses UTF-8, keys sorted alphabetically at all nesting levels,
    and compact separators (',', ':') with no extraneous whitespace.
    """
    return json.dumps(
        data,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def compute_sha256(canonical_bytes: bytes) -> str:
    """Compute standard lowercase hex SHA-256 digest over canonical bytes."""
    return hashlib.sha256(canonical_bytes).hexdigest()


def create_evidence_payload(
    alert_id: str,
    prefix: str,
    observed_asn: str,
    baseline_asn: str | None,
    parent_prefix: str | None,
    rule_name: str,
    severity: str,
    explanation: str,
    timestamp: str,
    collector: str = "manual",
    scenario: str | None = None,
    context: Dict[str, Any] | None = None,
) -> Tuple[Dict[str, Any], str]:
    """Construct structured evidence dictionary and compute its SHA-256 digest.

    Returns (evidence_dict, sha256_hex_digest).
    """
    record: Dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "alert_id": alert_id,
        "timestamp": timestamp,
        "rule": rule_name,
        "severity": severity,
        "prefix": prefix,
        "observed_asn": observed_asn,
        "baseline_asn": baseline_asn,
        "parent_prefix": parent_prefix,
        "collector": collector,
        "scenario": scenario,
        "explanation": explanation,
        "context": context or {},
    }

    canon_bytes = canonicalize_json(record)
    digest = compute_sha256(canon_bytes)
    return record, digest


def verify_evidence_hash(record: Dict[str, Any], expected_hash: str) -> Tuple[bool, str]:
    """Recomputes SHA-256 digest of record and verifies if it matches expected_hash.

    Returns (is_valid, computed_hash).
    """
    canon_bytes = canonicalize_json(record)
    computed = compute_sha256(canon_bytes)
    is_valid = (computed.lower() == expected_hash.lower())
    return is_valid, computed
