"""RIPEstat RPKI Origin-Validation Context integration.

Adheres strictly to Document 17 and WP-07:
- Queries official RIPEstat RPKI validation endpoint with bounded timeout for live lookups.
- Clearly labels live lookups as CURRENT_LOOKUP_CONTEXT with provider and lookup timestamp.
- For historical events, strictly requires a time-matched ROA snapshot at or before the event timestamp.
- If historical snapshot is missing or newer than event, returns HISTORICAL_RPKI_UNAVAILABLE.
- Never substitutes a present-day live lookup for a historical event.
- Returns explicit states: VALID, INVALID, UNKNOWN, UNAVAILABLE, HISTORICAL_RPKI_UNAVAILABLE.
- Never silently invents or assumes a verdict on network or API failure.
- Explains that RPKI origin validation evaluates whether the origin ASN is authorized for
  the prefix/maxLength context; it does NOT validate the complete AS_PATH or prove benign intent.
"""

import ipaddress
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx

from horaq.config import settings
from horaq.normalization import normalize_timestamp


RIPESTAT_RPKI_URL = "https://stat.ripe.net/data/rpki-validation/data.json"
RPKI_SEMANTICS_NOTE = (
    "RPKI Origin Validation evaluates whether the origin ASN is authorized for the prefix/maxLength "
    "context in a cryptographic ROA; it does NOT validate the complete AS_PATH or prove benign intent."
)


def _parse_timestamp(val: Any) -> Optional[datetime]:
    """Parse integer Unix timestamp or ISO string into UTC datetime."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return datetime.fromtimestamp(val, tz=timezone.utc)
    if isinstance(val, str):
        val = val.strip()
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except ValueError:
            try:
                return datetime.fromtimestamp(float(val), tz=timezone.utc)
            except ValueError:
                pass
    return None


def get_historical_rpki_context(
    prefix: str,
    asn: str,
    event_timestamp: Any,
    roa_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Evaluate RPKI validation status for historical events using time-matched snapshots (WP-07).

    Strict time-correctness rules:
    - Never substitute a present-day live lookup for a historical event.
    - If no snapshot is supplied, return HISTORICAL_RPKI_UNAVAILABLE.
    - If snapshot timestamp is newer than event timestamp, reject as invalid.
    - Only snapshots with timestamp <= event timestamp are evaluated.
    """
    event_dt = _parse_timestamp(event_timestamp)
    event_ts_str = event_dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ") if event_dt else str(event_timestamp)
    clean_asn = str(asn).strip().upper().replace("AS", "") if asn else ""

    if roa_snapshot is None:
        return {
            "prefix": prefix,
            "origin_asn": asn,
            "status": "HISTORICAL_RPKI_UNAVAILABLE",
            "context_mode": "HISTORICAL_REPLAY",
            "provider": "NONE",
            "lookup_time": None,
            "event_timestamp": event_ts_str,
            "details": (
                "No time-matched historical ROA snapshot provided for historical replay event. "
                "Present-day live lookup rejected to prevent historical confusion."
            ),
            "semantics_note": RPKI_SEMANTICS_NOTE,
            "validating_roas": [],
        }

    snapshot_ts_raw = roa_snapshot.get("timestamp")
    snapshot_dt = _parse_timestamp(snapshot_ts_raw)
    snapshot_ts_str = snapshot_dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ") if snapshot_dt else str(snapshot_ts_raw)

    if event_dt and snapshot_dt and snapshot_dt > event_dt:
        return {
            "prefix": prefix,
            "origin_asn": asn,
            "status": "HISTORICAL_RPKI_UNAVAILABLE",
            "context_mode": "HISTORICAL_REPLAY",
            "provider": roa_snapshot.get("provider", "HISTORICAL_ROA_ARCHIVE"),
            "lookup_time": None,
            "event_timestamp": event_ts_str,
            "snapshot_timestamp": snapshot_ts_str,
            "details": (
                f"ROA snapshot timestamp ({snapshot_ts_str}) is newer than event timestamp ({event_ts_str}); "
                f"rejected to preserve historical time-correctness."
            ),
            "semantics_note": RPKI_SEMANTICS_NOTE,
            "validating_roas": [],
        }

    # Evaluate ROAs in snapshot against prefix and origin ASN
    try:
        route_net = ipaddress.ip_network(prefix, strict=False)
    except ValueError:
        return {
            "prefix": prefix,
            "origin_asn": asn,
            "status": "HISTORICAL_RPKI_UNAVAILABLE",
            "context_mode": "HISTORICAL_TIME_MATCHED_SNAPSHOT",
            "provider": roa_snapshot.get("provider", "HISTORICAL_ROA_ARCHIVE"),
            "lookup_time": None,
            "event_timestamp": event_ts_str,
            "snapshot_timestamp": snapshot_ts_str,
            "details": f"Invalid prefix format: {prefix}",
            "semantics_note": RPKI_SEMANTICS_NOTE,
            "validating_roas": [],
        }

    roas = roa_snapshot.get("roas", [])
    covering_roas = []
    has_covering_prefix = False
    valid_roas = []

    for roa in roas:
        roa_pfx = roa.get("prefix", "")
        roa_asn = str(roa.get("origin_asn") or roa.get("asn") or "").upper().replace("AS", "")
        max_len = roa.get("max_length", roa.get("maxLength"))
        try:
            roa_net = ipaddress.ip_network(roa_pfx, strict=False)
        except ValueError:
            continue

        if route_net.version != roa_net.version:
            continue

        # Check subnet containment (route subnet of roa_net)
        if route_net.subnet_of(roa_net):
            has_covering_prefix = True
            covering_roas.append(roa)
            effective_max_len = max_len if max_len is not None else roa_net.prefixlen
            if roa_asn == clean_asn and route_net.prefixlen <= effective_max_len:
                valid_roas.append(roa)

    if not has_covering_prefix:
        status = "UNKNOWN"
        details = f"No covering ROA found in time-matched snapshot ({snapshot_ts_str}) for prefix {prefix}."
    elif len(valid_roas) > 0:
        status = "VALID"
        details = f"Authorized by {len(valid_roas)} matching ROA(s) in snapshot ({snapshot_ts_str})."
    else:
        status = "INVALID"
        details = (
            f"Covering ROA found in snapshot ({snapshot_ts_str}), but origin AS{clean_asn} or prefix length "
            f"/{route_net.prefixlen} is unauthorized."
        )

    return {
        "prefix": prefix,
        "origin_asn": asn,
        "status": status,
        "context_mode": "HISTORICAL_TIME_MATCHED_SNAPSHOT",
        "provider": roa_snapshot.get("provider", "HISTORICAL_ROA_ARCHIVE"),
        "lookup_time": None,
        "event_timestamp": event_ts_str,
        "snapshot_timestamp": snapshot_ts_str,
        "details": details,
        "semantics_note": RPKI_SEMANTICS_NOTE,
        "validating_roas": valid_roas if status == "VALID" else covering_roas,
    }


async def check_rpki_origin_validation(
    prefix: str,
    asn: str,
    timeout: float | None = None,
    event_timestamp: Any = None,
    roa_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Perform RPKI Origin Validation check adhering strictly to Document 17 and WP-07.

    - If event_timestamp is supplied for a historical replay, delegates to time-matched
      historical snapshot evaluation. Never substitutes present-day live lookups.
    - If event_timestamp is None, queries official RIPEstat endpoint for CURRENT_LOOKUP_CONTEXT.
    """
    if event_timestamp is not None:
        return get_historical_rpki_context(
            prefix=prefix,
            asn=asn,
            event_timestamp=event_timestamp,
            roa_snapshot=roa_snapshot,
        )

    lookup_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    timeout_sec = timeout if timeout is not None else settings.rpki_timeout

    asn_clean = asn.upper().replace("AS", "") if asn else ""

    params = {
        "resource": asn_clean,
        "prefix": prefix,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            resp = await client.get(RIPESTAT_RPKI_URL, params=params)

            if resp.status_code != 200:
                return {
                    "prefix": prefix,
                    "origin_asn": asn,
                    "status": "UNAVAILABLE",
                    "context_mode": "CURRENT_LOOKUP_CONTEXT",
                    "lookup_time": lookup_time,
                    "provider": "RIPEstat",
                    "details": f"HTTP status {resp.status_code} returned by RIPEstat provider.",
                    "semantics_note": RPKI_SEMANTICS_NOTE,
                    "validating_roas": [],
                }

            data = resp.json()
            data_body = data.get("data", {})
            raw_status = str(data_body.get("status", "")).upper()

            if "INVALID" in raw_status:
                norm_status = "INVALID"
            elif "VALID" in raw_status:
                norm_status = "VALID"
            elif raw_status in ("UNKNOWN", "NOT_FOUND", "NOT-FOUND"):
                norm_status = "UNKNOWN"
            else:
                norm_status = "UNKNOWN"

            validating_roas = data_body.get("validating_roas", [])

            return {
                "prefix": prefix,
                "origin_asn": asn,
                "status": norm_status,
                "raw_status": raw_status,
                "context_mode": "CURRENT_LOOKUP_CONTEXT",
                "lookup_time": lookup_time,
                "provider": "RIPEstat",
                "details": f"RPKI validation result from RIPEstat: {norm_status}",
                "semantics_note": RPKI_SEMANTICS_NOTE,
                "validating_roas": validating_roas,
            }

    except httpx.TimeoutException:
        return {
            "prefix": prefix,
            "origin_asn": asn,
            "status": "UNAVAILABLE",
            "context_mode": "CURRENT_LOOKUP_CONTEXT",
            "lookup_time": lookup_time,
            "provider": "RIPEstat",
            "details": f"Request to RIPEstat timed out after {timeout_sec:.1f}s.",
            "semantics_note": RPKI_SEMANTICS_NOTE,
            "validating_roas": [],
        }
    except Exception as err:
        return {
            "prefix": prefix,
            "origin_asn": asn,
            "status": "UNAVAILABLE",
            "context_mode": "CURRENT_LOOKUP_CONTEXT",
            "lookup_time": lookup_time,
            "provider": "RIPEstat",
            "details": f"External provider error: {err}",
            "semantics_note": RPKI_SEMANTICS_NOTE,
            "validating_roas": [],
        }
