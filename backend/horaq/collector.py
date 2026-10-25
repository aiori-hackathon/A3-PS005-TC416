"""RIPE RIS Live WebSocket Collector.

Adheres to Document 16 and AIORI Hackathon Requirements:
- Opt-in background live BGP feed collection.
- Resilient WebSocket connection with automatic backoff, reconnect counter, and error tracking.
- Robust parsing of RIPE RIS Live format.
- Explicit terminal AS_SET path element handling (RFC 4271/RFC 6472):
  - Single-element AS_SET is safely unwrapped to the candidate origin ASN with as_set flag.
  - Multi-element AS_SET is explicitly skipped with RFC 6472 deprecation notice (ambiguous origin).
- Withdrawal message recognition and telemetry.
- Transparent operational status tracking (received, parsed, skipped, withdrawals, as_set, reconnects).
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import websockets

from horaq.config import settings
from horaq.detection import process_observation, process_withdrawal


logger = logging.getLogger("horaq.collector")


_active_collector: Optional["RISLiveCollector"] = None


def parse_ris_message(msg: Dict[str, Any]) -> Dict[str, Any]:
    """Parse a RIPE RIS Live JSON message and extract route announcements and withdrawals.

    RIPE RIS Live format specification:
    - msg['type'] == 'ris_message'
    - msg['data']['path']: list of ASNs (e.g., [174, 13335]) or AS_SETs (e.g., [174, [13335]])
    - msg['data']['announcements']: list of dicts with 'prefixes'
    - msg['data']['withdrawals']: list of string prefixes
    """
    msg_type = msg.get("type")
    if msg_type != "ris_message":
        return {
            "valid": False,
            "announcements": [],
            "withdrawals": [],
            "as_set_handled": 0,
            "as_set_skipped": 0,
            "skipped_reason": f"Non-update message type: '{msg_type}'",
        }

    data = msg.get("data", {})
    if not isinstance(data, dict):
        return {
            "valid": False,
            "announcements": [],
            "withdrawals": [],
            "withdrawal_records": [],
            "as_set_handled": 0,
            "as_set_skipped": 0,
            "skipped_reason": "Malformed 'data' field in RIS message",
        }

    # Extract peer, collector host, and timestamp metadata from RIPE RIS Live payload
    peer_ip = str(data.get("peer") or "").strip() or None
    peer_as = str(data.get("peer_asn") or "").strip() or None
    collector_host = str(data.get("host") or "ripe-ris-live").strip()
    ts = data.get("timestamp")

    path = data.get("path")
    if peer_as is None and path and isinstance(path, list) and len(path) > 0 and isinstance(path[0], (int, str)):
        peer_as = str(path[0])

    # Extract withdrawals if present
    raw_withdrawals = data.get("withdrawals", [])
    withdrawals: List[str] = []
    withdrawal_records: List[Dict[str, Any]] = []
    if isinstance(raw_withdrawals, list):
        for w in raw_withdrawals:
            if isinstance(w, str) and w.strip():
                clean_w = w.strip()
                withdrawals.append(clean_w)
                withdrawal_records.append({
                    "prefix": clean_w,
                    "peer_as": peer_as,
                    "peer_ip": peer_ip,
                    "collector": collector_host,
                    "timestamp": ts,
                })

    announcements_data = data.get("announcements", [])

    # If it is a pure withdrawal message with no announcements
    if not announcements_data and withdrawals:
        return {
            "valid": True,
            "announcements": [],
            "withdrawals": withdrawals,
            "withdrawal_records": withdrawal_records,
            "as_set_handled": 0,
            "as_set_skipped": 0,
            "skipped_reason": "BGP withdrawal update (no route announcements)",
        }

    if not path or not isinstance(path, list) or len(path) == 0:
        return {
            "valid": False,
            "announcements": [],
            "withdrawals": withdrawals,
            "withdrawal_records": withdrawal_records,
            "as_set_handled": 0,
            "as_set_skipped": 0,
            "skipped_reason": "Missing or empty AS_PATH in announcement",
        }

    if not announcements_data or not isinstance(announcements_data, list):
        return {
            "valid": False,
            "announcements": [],
            "withdrawals": withdrawals,
            "withdrawal_records": withdrawal_records,
            "as_set_handled": 0,
            "as_set_skipped": 0,
            "skipped_reason": "No announcements list found in update",
        }

    # Inspect terminal AS_PATH element
    terminal_elem = path[-1]
    origin_asn: Any = None
    as_set_handled = 0
    as_set_skipped = 0
    is_as_set = False
    as_set_members: Optional[List[Any]] = None

    if isinstance(terminal_elem, (list, tuple, set)):
        is_as_set = True
        members = list(terminal_elem)
        as_set_members = members
        if len(members) == 0:
            return {
                "valid": False,
                "announcements": [],
                "withdrawals": withdrawals,
                "withdrawal_records": withdrawal_records,
                "as_set_handled": 0,
                "as_set_skipped": 1,
                "skipped_reason": "Terminal AS_SET is empty",
            }
        elif len(members) == 1:
            # Single-element AS_SET: safely unwrap candidate origin ASN
            origin_asn = members[0]
            as_set_handled = 1
        else:
            # Multi-element AS_SET: ambiguous origin (RFC 6472 deprecated)
            return {
                "valid": False,
                "announcements": [],
                "withdrawals": withdrawals,
                "withdrawal_records": withdrawal_records,
                "as_set_handled": 0,
                "as_set_skipped": 1,
                "skipped_reason": (
                    f"Terminal AS_SET contains multiple candidate origins {members} "
                    "(RFC 6472 deprecated; origin ambiguous)"
                ),
            }
    else:
        origin_asn = terminal_elem

    # Collect announced prefixes
    parsed_announcements: List[Dict[str, Any]] = []
    seen_prefixes = set()

    for item in announcements_data:
        if not isinstance(item, dict):
            continue
        prefixes = item.get("prefixes", [])
        if not isinstance(prefixes, list):
            continue
        for p in prefixes:
            if not isinstance(p, str) or not p.strip():
                continue
            cleaned = p.strip()
            # Deduplicate within same message to avoid double-processing
            if cleaned in seen_prefixes:
                continue
            seen_prefixes.add(cleaned)

            parsed_announcements.append({
                "prefix": cleaned,
                "origin_asn": origin_asn,
                "timestamp": ts,
                "peer_as": peer_as,
                "peer_ip": peer_ip,
                "collector": collector_host,
                "metadata": {
                    "peer": peer_ip,
                    "peer_ip": peer_ip,
                    "peer_asn": peer_as,
                    "peer_as": peer_as,
                    "host": collector_host,
                    "collector": collector_host,
                    "path_length": len(path),
                    "terminal_as_set": is_as_set,
                    "as_set_members": as_set_members,
                },
            })

    if not parsed_announcements:
        return {
            "valid": False,
            "announcements": [],
            "withdrawals": withdrawals,
            "withdrawal_records": withdrawal_records,
            "as_set_handled": as_set_handled,
            "as_set_skipped": as_set_skipped,
            "skipped_reason": "No valid prefix strings found in announcement",
        }

    return {
        "valid": True,
        "announcements": parsed_announcements,
        "withdrawals": withdrawals,
        "withdrawal_records": withdrawal_records,
        "as_set_handled": as_set_handled,
        "as_set_skipped": as_set_skipped,
        "skipped_reason": None,
    }


def get_collector_telemetry() -> Dict[str, Any]:
    """Return operational status and telemetry of the active live collector."""
    global _active_collector
    if _active_collector is not None:
        return _active_collector.get_status()
    return {
        "enabled": settings.live_collector_enabled,
        "running": False,
        "connected": False,
        "url": settings.ris_url,
        "messages_received": 0,
        "messages_parsed": 0,
        "messages_skipped": 0,
        "withdrawals_received": 0,
        "as_set_handled": 0,
        "as_set_skipped": 0,
        "reconnect_count": 0,
        "last_message_at": None,
        "last_skipped_reason": None,
        "last_error": None,
    }


class RISLiveCollector:
    def __init__(self, db_path: str, url: Optional[str] = None) -> None:
        global _active_collector
        self.db_path = db_path
        self.url = url or settings.ris_url
        self.is_enabled = settings.live_collector_enabled
        self.is_running = False
        self.is_connected = False
        self.task: Optional[asyncio.Task] = None
        self.messages_received = 0
        self.messages_parsed = 0
        self.messages_skipped = 0
        self.withdrawals_received = 0
        self.as_set_handled = 0
        self.as_set_skipped = 0
        self.reconnect_count = 0
        self.last_message_at: Optional[str] = None
        self.last_skipped_reason: Optional[str] = None
        self.last_error: Optional[str] = None
        _active_collector = self

    def get_status(self) -> Dict[str, Any]:
        """Return operational telemetry for the collector."""
        return {
            "enabled": self.is_enabled,
            "running": self.is_running,
            "connected": self.is_connected,
            "url": self.url,
            "messages_received": self.messages_received,
            "messages_parsed": self.messages_parsed,
            "messages_skipped": self.messages_skipped,
            "withdrawals_received": self.withdrawals_received,
            "as_set_handled": self.as_set_handled,
            "as_set_skipped": self.as_set_skipped,
            "reconnect_count": self.reconnect_count,
            "last_message_at": self.last_message_at,
            "last_skipped_reason": self.last_skipped_reason,
            "last_error": self.last_error,
        }

    async def start(self) -> None:
        """Start the collector loop if enabled and not already running."""
        if self.is_running:
            return
        self.is_running = True
        self.task = asyncio.create_task(self._run_loop())
        logger.info("RIPE RIS Live collector background task initiated.")

    async def stop(self) -> None:
        """Cancel the collector loop and cleanly disconnect."""
        self.is_running = False
        self.is_connected = False
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("RIPE RIS Live collector stopped.")

    async def _run_loop(self) -> None:
        retry_delay = 5
        while self.is_running:
            try:
                logger.info(f"Connecting to RIS Live at {self.url}...")
                async with websockets.connect(self.url, ping_interval=30, ping_timeout=10) as ws:
                    self.is_connected = True
                    self.last_error = None
                    logger.info("Connected to RIPE RIS Live feed.")

                    # Send subscription request for BGP UPDATE messages
                    sub_msg = {
                        "type": "ris_subscribe",
                        "data": {
                            "type": "UPDATE",
                            "require": "announcements",
                        },
                    }
                    await ws.send(json.dumps(sub_msg))

                    while self.is_running:
                        msg_raw = await ws.recv()
                        self.messages_received += 1
                        self.last_message_at = datetime.now(timezone.utc).strftime(
                            "%Y-%m-%dT%H:%M:%S.%fZ"
                        )
                        self._handle_message(msg_raw)

            except asyncio.CancelledError:
                break
            except Exception as err:
                self.is_connected = False
                self.reconnect_count += 1
                self.last_error = str(err)
                logger.warning(
                    f"RIS Live connection lost (attempt #{self.reconnect_count}): {err}. "
                    f"Reconnecting in {retry_delay}s..."
                )
                await asyncio.sleep(retry_delay)

        self.is_connected = False

    def _handle_message(self, raw_str: str) -> None:
        """Parse raw RIS Live message and ingest any route announcements."""
        try:
            msg = json.loads(raw_str)
        except Exception as err:
            self.messages_skipped += 1
            self.last_skipped_reason = f"JSON decode error: {err}"
            return

        result = parse_ris_message(msg)

        # 1. Process BGP withdrawals safely through the withdrawal pipeline
        withdrawal_records = result.get("withdrawal_records") or [
            {
                "prefix": w,
                "peer_as": None,
                "peer_ip": None,
                "collector": "ripe-ris-live",
                "timestamp": None,
            }
            for w in result.get("withdrawals", [])
        ]
        if withdrawal_records:
            self.withdrawals_received += len(withdrawal_records)
            for w_rec in withdrawal_records:
                try:
                    process_withdrawal(
                        db_path=self.db_path,
                        prefix_raw=w_rec["prefix"],
                        collector=w_rec.get("collector") or "ripe-ris-live",
                        peer_as=w_rec.get("peer_as"),
                        peer_ip=w_rec.get("peer_ip"),
                        timestamp_raw=w_rec.get("timestamp"),
                        scenario="ripe-ris-live",
                        raw_metadata={
                            "peer_ip": w_rec.get("peer_ip"),
                            "peer_as": w_rec.get("peer_as"),
                            "collector": w_rec.get("collector"),
                        },
                    )
                except Exception as w_err:
                    logger.debug(f"Failed to process live withdrawal for '{w_rec['prefix']}': {w_err}")

        self.as_set_handled += result.get("as_set_handled", 0)
        self.as_set_skipped += result.get("as_set_skipped", 0)

        if not result.get("valid"):
            self.messages_skipped += 1
            if result.get("skipped_reason"):
                self.last_skipped_reason = result["skipped_reason"]
            return

        announcements = result.get("announcements", [])
        if not announcements:
            if result.get("skipped_reason"):
                self.last_skipped_reason = result["skipped_reason"]
            return

        for item in announcements:
            prefix = item["prefix"]
            origin_asn = item["origin_asn"]
            ts = item.get("timestamp")
            peer_as = item.get("peer_as")
            peer_ip = item.get("peer_ip")
            collector = item.get("collector") or "ripe-ris-live"
            raw_meta = item.get("metadata", {})
            try:
                process_observation(
                    db_path=self.db_path,
                    prefix_raw=prefix,
                    origin_asn_raw=origin_asn,
                    collector=collector,
                    timestamp_raw=ts,
                    scenario="ripe-ris-live",
                    raw_metadata=raw_meta,
                    peer_as=peer_as,
                    peer_ip=peer_ip,
                )
                self.messages_parsed += 1
            except Exception as parse_err:
                self.messages_skipped += 1
                self.last_skipped_reason = f"Failed to ingest {prefix}: {parse_err}"
                logger.debug(f"Skipped prefix '{prefix}': {parse_err}")
