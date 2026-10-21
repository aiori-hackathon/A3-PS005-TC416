"""Normalization and input validation for BGP observations.

Adheres strictly to HORA-Q specification:
- Prefix canonicalization (IPv4/IPv6 CIDR, non-strict host bit normalization to network boundary)
- ASN normalization to AS<number> format (RFC 6793 range [1, 4294967295], ASDOT rejected)
- ISO 8601 UTC timestamp canonicalization
"""

import ipaddress
import re
from datetime import datetime, timezone
from typing import Any, Tuple, Union


MAX_ASN = 4294967295  # 32-bit ASN limit (RFC 6793)


def normalize_prefix(prefix_raw: str) -> Tuple[str, int]:
    """Validate and canonicalize an IPv4 or IPv6 CIDR network prefix.

    Returns (canonical_cidr_string, ip_version).
    Normalizes host bits to the network address.
    Raises ValueError on malformed or non-CIDR input.
    """
    if not prefix_raw or not isinstance(prefix_raw, str):
        raise ValueError("Prefix must be a non-empty string.")

    cleaned = prefix_raw.strip()
    if "/" not in cleaned:
        raise ValueError(f"Prefix '{prefix_raw}' missing CIDR mask (e.g. /24).")

    try:
        # strict=False normalizes host bits (e.g. 192.0.2.1/24 -> 192.0.2.0/24)
        net = ipaddress.ip_network(cleaned, strict=False)
    except ValueError as err:
        raise ValueError(f"Invalid IP prefix '{prefix_raw}': {err}") from err

    return str(net), net.version


def normalize_asn(asn_raw: Union[int, str]) -> str:
    """Validate and canonicalize an Autonomous System Number into 'AS<number>' format.

    Rejects:
    - 0 and out-of-range (> 4294967295) values
    - Negative values
    - ASDOT format (e.g. '1.10') per spec 10
    """
    if asn_raw is None:
        raise ValueError("ASN cannot be null.")

    if isinstance(asn_raw, int):
        val = asn_raw
    elif isinstance(asn_raw, str):
        s = asn_raw.strip()
        if "." in s:
            raise ValueError(f"ASDOT format '{s}' is not supported. Use plain 32-bit AS number.")
        if s.upper().startswith("AS"):
            s = s[2:].strip()
        if not s.isdigit():
            raise ValueError(f"Invalid ASN format: '{asn_raw}'. Must be an integer or 'AS<number>'.")
        val = int(s)
    else:
        raise ValueError(f"Unsupported ASN type: {type(asn_raw).__name__}")

    if val <= 0:
        raise ValueError(f"Invalid ASN {val}. AS0 is reserved and non-routable.")
    if val > MAX_ASN:
        raise ValueError(f"ASN {val} exceeds 32-bit range (max {MAX_ASN}).")

    return f"AS{val}"


def normalize_timestamp(ts_raw: Any = None) -> str:
    """Validate and normalize timestamp into ISO 8601 UTC string (YYYY-MM-DDTHH:MM:SS.fZ)."""
    if ts_raw is None or ts_raw == "":
        dt = datetime.now(timezone.utc)
    elif isinstance(ts_raw, datetime):
        if ts_raw.tzinfo is None:
            dt = ts_raw.replace(tzinfo=timezone.utc)
        else:
            dt = ts_raw.astimezone(timezone.utc)
    elif isinstance(ts_raw, (int, float)):
        # UNIX epoch seconds
        dt = datetime.fromtimestamp(ts_raw, tz=timezone.utc)
    elif isinstance(ts_raw, str):
        s = ts_raw.strip()
        try:
            # Handle ISO string with optional trailing Z or offset
            if s.endswith("Z"):
                s = s[:-1] + "+00:00"
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
        except Exception as err:
            raise ValueError(f"Invalid ISO 8601 timestamp '{ts_raw}': {err}") from err
    else:
        raise ValueError(f"Unsupported timestamp format: {type(ts_raw).__name__}")

    return dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
