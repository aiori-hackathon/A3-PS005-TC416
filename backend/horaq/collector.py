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


def build_ris_subscription() -> Dict[str, Any]:
    """Construct RIPE RIS Live subscription message.

    Subscribes to BGP UPDATE messages without a 'require: announcements' filter,
    ensuring withdrawal-only UPDATEs are received alongside announcements and mixed UPDATEs
    (adheres to WP-01 and RIPE RIS Live specification).
    """
    return {
        "type": "ris_subscribe",
        "data": {
            "type": "UPDATE",
        },
    }


def parse_ris_message(msg: Dict[str, Any]) -> Dict[str, Any]:
    """Parse a RIPE RIS Live JSON message and extract route announcements and withdrawals.

    RIPE RIS Live format specification:
    - msg['type'] == 'ris_message'
    - msg['data']['path']: list of ASNs (e.g., [174, 13335]) or AS_SETs (e.g., [174, [13335]])
    - msg['data']['announcements']: list of dicts with 'prefixes'
    - msg['data']['withdrawals']: list of string prefixes
    """
    msg_type = msg.get("type")
    data = msg.get("data", {})

    # Recognize RIS peer-state notifications explicitly without confusing with route withdrawals (WP-06)
    if msg_type in ("ris_peer_state", "ris_peer_down", "ris_peer_up") or (
        msg_type == "ris_message" and isinstance(data, dict) and data.get("type") in ("STATE_CHANGE", "PEER_DOWN", "PEER_UP")
    ):
        peer_ip = str(data.get("peer") or "").strip() or None if isinstance(data, dict) else None
        peer_as = str(data.get("peer_asn") or "").strip() or None if isinstance(data, dict) else None
        host = str(data.get("host") or "ripe-ris-live").strip() if isinstance(data, dict) else "ripe-ris-live"
        return {
            "valid": False,
            "is_peer_state_event": True,
            "peer_state": (data.get("state") or data.get("type") or msg_type) if isinstance(data, dict) else msg_type,
            "peer_as": peer_as,
            "peer_ip": peer_ip,
            "collector": host,
            "announcements": [],
            "withdrawals": [],
            "withdrawal_records": [],
            "as_set_handled": 0,
            "as_set_skipped": 0,
            "skipped_reason": f"Transport peer-state notification ({msg_type}); not a route withdrawal",
        }

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

    # Extract peer, collector host, timestamp, and message ID metadata
    peer_ip = str(data.get("peer") or "").strip() or None
    peer_as = str(data.get("peer_asn") or "").strip() or None
    collector_host = str(data.get("host") or "ripe-ris-live").strip()
    ts = data.get("timestamp")
    ris_msg_id = str(msg.get("id") or data.get("id") or "").strip() or None

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
                    "ris_message_id": ris_msg_id,
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

    # If empty update with neither announcements nor withdrawals
    if not announcements_data and not withdrawals:
        return {
            "valid": False,
            "announcements": [],
            "withdrawals": [],
            "withdrawal_records": [],
            "as_set_handled": 0,
            "as_set_skipped": 0,
            "skipped_reason": "Empty UPDATE: contains neither announcements nor withdrawals",
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
                "ris_message_id": ris_msg_id,
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
                    "ris_message_id": ris_msg_id,
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


def _parse_collector_time(val: Any) -> datetime:
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
    return datetime.now(timezone.utc)


def compute_collector_health_state(
    status: Dict[str, Any],
    current_time: Optional[datetime] = None,
    heartbeat_timeout_sec: int = 60,
    stale_timeout_sec: int = 300,
) -> str:
    """Compute truthful operational monitoring state without confusing silence with route withdrawal.

    Distinct states (WP-06):
    - CONNECTED: Transport is connected and recent updates have been received.
    - CONNECTED_NO_RECENT_UPDATES: Transport is alive, but no new BGP updates have arrived within heartbeat window.
    - DISCONNECTED: Transport is not connected.
    - STALE_OR_UNKNOWN: Health cannot be confirmed or collector disabled.
    """
    if not status.get("enabled"):
        return "DISCONNECTED"
    if not status.get("running") or not status.get("connected"):
        return "DISCONNECTED"

    now = current_time or datetime.now(timezone.utc)
    last_update_str = status.get("last_parsed_update_at")
    last_msg_str = status.get("last_transport_message_at") or status.get("last_message_at")

    if not last_msg_str:
        return "CONNECTED_NO_RECENT_UPDATES"

    last_msg_dt = _parse_collector_time(last_msg_str)
    if (now - last_msg_dt).total_seconds() > stale_timeout_sec:
        return "STALE_OR_UNKNOWN"

    if not last_update_str:
        return "CONNECTED_NO_RECENT_UPDATES"

    last_update_dt = _parse_collector_time(last_update_str)
    delta_update = (now - last_update_dt).total_seconds()
    if delta_update > heartbeat_timeout_sec:
        return "CONNECTED_NO_RECENT_UPDATES"

    return "CONNECTED"


def get_collector_telemetry() -> Dict[str, Any]:
    """Return operational status and telemetry of the active live collector."""
    global _active_collector
    if _active_collector is not None:
        return _active_collector.get_status()
    st = {
        "enabled": settings.live_collector_enabled,
        "running": False,
        "connected": False,
        "health_state": "DISCONNECTED",
        "url": settings.ris_url,
        "messages_received": 0,
        "messages_parsed": 0,
        "messages_skipped": 0,
        "withdrawals_received": 0,
        "peer_state_events": 0,
        "as_set_handled": 0,
        "as_set_skipped": 0,
        "reconnect_count": 0,
        "last_message_at": None,
        "last_transport_message_at": None,
        "last_valid_ris_message_at": None,
        "last_parsed_update_at": None,
        "last_peer_state_event_at": None,
        "last_skipped_reason": None,
        "last_error": None,
        "heartbeat_timeout_sec": 60,
    }
    st["health_state"] = compute_collector_health_state(st)
    return st


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
        self.peer_state_events = 0
        self.as_set_handled = 0
        self.as_set_skipped = 0
        self.reconnect_count = 0
        self.last_message_at: Optional[str] = None
        self.last_transport_message_at: Optional[str] = None
        self.last_valid_ris_message_at: Optional[str] = None
        self.last_parsed_update_at: Optional[str] = None
        self.last_peer_state_event_at: Optional[str] = None
        self.last_skipped_reason: Optional[str] = None
        self.last_error: Optional[str] = None
        self.heartbeat_timeout_sec = 60
        _active_collector = self

    def get_status(self) -> Dict[str, Any]:
        """Return operational telemetry for the collector."""
        st = {
            "enabled": self.is_enabled,
            "running": self.is_running,
            "connected": self.is_connected,
            "url": self.url,
            "messages_received": self.messages_received,
            "messages_parsed": self.messages_parsed,
            "messages_skipped": self.messages_skipped,
            "withdrawals_received": self.withdrawals_received,
            "peer_state_events": self.peer_state_events,
            "as_set_handled": self.as_set_handled,
            "as_set_skipped": self.as_set_skipped,
            "reconnect_count": self.reconnect_count,
            "last_message_at": self.last_message_at,
            "last_transport_message_at": self.last_transport_message_at,
            "last_valid_ris_message_at": self.last_valid_ris_message_at,
            "last_parsed_update_at": self.last_parsed_update_at,
            "last_peer_state_event_at": self.last_peer_state_event_at,
            "last_skipped_reason": self.last_skipped_reason,
            "last_error": self.last_error,
            "heartbeat_timeout_sec": self.heartbeat_timeout_sec,
        }
        st["health_state"] = compute_collector_health_state(st, heartbeat_timeout_sec=self.heartbeat_timeout_sec)
        return st

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

                    # Send subscription request for BGP UPDATE messages (WP-01 pure helper)
                    sub_msg = build_ris_subscription()
                    await ws.send(json.dumps(sub_msg))

                    while self.is_running:
                        msg_raw = await ws.recv()
                        self.messages_received += 1
                        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                        self.last_message_at = now_str
                        self.last_transport_message_at = now_str
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

        if result.get("is_peer_state_event"):
            self.peer_state_events += 1
            now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            self.last_peer_state_event_at = now_str
            self.last_skipped_reason = result.get("skipped_reason")
            return

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        self.last_valid_ris_message_at = now_str

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
            self.last_parsed_update_at = now_str
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
                self.last_parsed_update_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            except Exception as parse_err:
                self.messages_skipped += 1
                self.last_skipped_reason = f"Failed to ingest {prefix}: {parse_err}"
                logger.debug(f"Skipped prefix '{prefix}': {parse_err}")
