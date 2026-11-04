"""Evidence records and integrity verification for HORA-Q.

Adheres to Document 18:
- Canonical JSON serialization (UTF-8, sorted keys, compact delimiters)
- SHA-256 hashing for content integrity
- Separation between integrity hash and cryptographic signature
"""

import hashlib
import importlib
import json
from typing import Any, Dict, Tuple


SCHEMA_VERSION = "1.1.0"
SUPPORTED_SCHEMA_VERSIONS = ("1.0.0", "1.1.0")
DEFAULT_RULE_VERSION = "2.0.0"
TRUST_STATEMENT = (
    "A digital signature verifies record integrity and signer authenticity "
    "under the configured public-key trust model; it does not prove that "
    "the underlying BGP observation is true."
)


def canonicalize_json(data: Dict[str, Any]) -> bytes:
    """Serialize dictionary to deterministic canonical JSON bytes per RFC 8785 (JCS).

    Strictly complies with RFC 8785 (JCS):
    - UTF-16 code unit lexicographical key sorting
    - IEEE 754 float formatting (negative zero -0.0 -> 0)
    - Compact separators without unnecessary whitespace
    - UTF-8 encoding without non-standard escapes
    """
    try:
        import rfc8785
        return rfc8785.dumps(data)
    except ImportError as err:
        raise RuntimeError(
            "RFC 8785 canonicalization requires the 'rfc8785' package. "
            "Incomplete fallbacks are prohibited by specification to prevent digest divergence. "
            "Please install with: pip install rfc8785>=0.1.4"
        ) from err


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
    # Upgraded WP-04 provenance parameters
    observation_id: int | None = None,
    supporting_observation_ids: list[int] | None = None,
    rule_version: str = DEFAULT_RULE_VERSION,
    peer_as: str | None = None,
    peer_ip: str | None = None,
    peer_session: str | None = None,
    ris_message_id: str | None = None,
    corroboration_summary: Dict[str, Any] | None = None,
    uncertainty_gaps: list[str] | None = None,
    rpki_context: Dict[str, Any] | None = None,
    schema_version: str = SCHEMA_VERSION,
) -> Tuple[Dict[str, Any], str]:
    """Construct structured evidence dictionary and compute its RFC 8785 SHA-256 digest.

    Binds alert facts directly to source observation provenance (WP-04).
    Returns (evidence_dict, sha256_hex_digest).
    """
    gaps: list[str] = list(uncertainty_gaps or [])
    if peer_as is None and "missing_peer_as" not in gaps:
        gaps.append("missing_peer_as")
    if peer_ip is None and "missing_peer_ip" not in gaps:
        gaps.append("missing_peer_ip")

    supp_ids = list(supporting_observation_ids or [])
    if observation_id is not None and observation_id not in supp_ids:
        supp_ids.insert(0, observation_id)

    record: Dict[str, Any] = {
        "schema_version": schema_version,
        "alert_id": alert_id,
        "timestamp": timestamp,
        "timestamp_semantics": "source_observation_time",
        "rule": rule_name,
        "rule_version": rule_version,
        "severity": severity,
        "prefix": prefix,
        "observed_asn": observed_asn,
        "baseline_asn": baseline_asn,
        "parent_prefix": parent_prefix,
        "collector": collector,
        "peer_as": peer_as,
        "peer_ip": peer_ip,
        "peer_session": peer_session,
        "ris_message_id": ris_message_id,
        "observation_id": observation_id,
        "supporting_observation_ids": supp_ids,
        "corroboration_summary": corroboration_summary or {},
        "uncertainty_gaps": gaps,
        "rpki_context": rpki_context,
        "scenario": scenario,
        "trust_statement": TRUST_STATEMENT,
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
