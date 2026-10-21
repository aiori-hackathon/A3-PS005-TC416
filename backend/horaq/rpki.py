"""RIPEstat RPKI Origin-Validation Context integration.

Adheres strictly to Document 17:
- Queries official RIPEstat RPKI validation endpoint with bounded timeout.
- Returns explicit states: VALID, INVALID, UNKNOWN, UNAVAILABLE.
- Never silently invents or assumes a verdict on network or API failure.
- Separates RPKI lookup timestamp from route observation timestamp.
"""

from datetime import datetime, timezone
from typing import Any, Dict
import httpx

from horaq.config import settings


RIPESTAT_RPKI_URL = "https://stat.ripe.net/data/rpki-validation/data.json"


async def check_rpki_origin_validation(
    prefix: str,
    asn: str,
    timeout: float | None = None,
) -> Dict[str, Any]:
    """Perform bounded query to RIPEstat for RPKI Origin Validation state.

    Prefix must be in CIDR notation (e.g. '192.0.2.0/24').
    ASN can be 'AS13335' or numeric '13335'.
    """
    lookup_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    timeout_sec = timeout if timeout is not None else settings.rpki_timeout

    # RIPEstat expects numeric resource or AS<num>
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
                    "lookup_time": lookup_time,
                    "provider": "RIPEstat",
                    "details": f"HTTP status {resp.status_code} returned by RIPEstat provider.",
                    "validating_roas": [],
                }

            data = resp.json()
            data_body = data.get("data", {})
            raw_status = str(data_body.get("status", "")).upper()

            # Map RIPEstat status strings: "valid", "invalid", "unknown", "not_found"
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
                "lookup_time": lookup_time,
                "provider": "RIPEstat",
                "details": f"RPKI validation result from RIPEstat: {norm_status}",
                "validating_roas": validating_roas,
            }

    except httpx.TimeoutException:
        return {
            "prefix": prefix,
            "origin_asn": asn,
            "status": "UNAVAILABLE",
            "lookup_time": lookup_time,
            "provider": "RIPEstat",
            "details": f"Request to RIPEstat timed out after {timeout_sec:.1f}s.",
            "validating_roas": [],
        }
    except Exception as err:
        return {
            "prefix": prefix,
            "origin_asn": asn,
            "status": "UNAVAILABLE",
            "lookup_time": lookup_time,
            "provider": "RIPEstat",
            "details": f"External provider error: {err}",
            "validating_roas": [],
        }
