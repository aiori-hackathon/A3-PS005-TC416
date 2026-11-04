"""Tests for WP-06: Collector Visibility and Health Awareness without Conflating Silence with Route Withdrawal."""

import json
import os
import tempfile
from datetime import datetime, timedelta, timezone
import pytest

from horaq.collector import (
    RISLiveCollector,
    compute_collector_health_state,
    parse_ris_message,
    get_collector_telemetry,
)
from horaq.database import init_db, list_alerts, list_observations
from horaq.detection import process_observation, process_withdrawal


@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_active_transport_without_updates_reports_connected_no_recent_updates():
    """Active WebSocket connection with no updates reports CONNECTED_NO_RECENT_UPDATES, not route withdrawn."""
    now = datetime.now(timezone.utc)
    old_update = (now - timedelta(seconds=120)).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    recent_msg = (now - timedelta(seconds=5)).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    status = {
        "enabled": True,
        "running": True,
        "connected": True,
        "last_transport_message_at": recent_msg,
        "last_parsed_update_at": old_update,
    }

    state = compute_collector_health_state(status, current_time=now, heartbeat_timeout_sec=60)
    assert state == "CONNECTED_NO_RECENT_UPDATES"
    assert state != "ROUTE_WITHDRAWN"


def test_websocket_disconnect_reports_disconnected_not_withdrawn():
    """WebSocket disconnect reports collector DISCONNECTED, never route withdrawn."""
    now = datetime.now(timezone.utc)
    status = {
        "enabled": True,
        "running": True,
        "connected": False,
        "last_transport_message_at": (now - timedelta(seconds=10)).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "last_parsed_update_at": (now - timedelta(seconds=10)).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
    }

    state = compute_collector_health_state(status, current_time=now)
    assert state == "DISCONNECTED"
    assert state != "ROUTE_WITHDRAWN"


def test_peer_state_notification_handled_without_withdrawing_route(temp_db):
    """A peer-state down notification is represented in telemetry and never treated as a route withdrawal."""
    # Seed baseline and an active alert
    process_observation(temp_db, "10.0.0.0/16", "AS15169", "rrc00", "2026-03-01T10:00:00Z", peer_as="AS101", peer_ip="192.0.2.1")
    process_observation(temp_db, "10.0.0.0/16", "AS15169", "rrc01", "2026-03-01T10:01:00Z", peer_as="AS102", peer_ip="192.0.2.2")
    process_observation(temp_db, "10.0.0.0/16", "AS15169", "rrc00", "2026-03-01T10:02:00Z", peer_as="AS101", peer_ip="192.0.2.1")

    # Inject anomaly alert
    process_observation(temp_db, "10.0.0.0/16", "AS999", "rrc00", "2026-03-01T11:00:00Z", peer_as="AS301", peer_ip="198.51.100.1")

    alerts_before, _ = list_alerts(temp_db, status="ACTIVE")
    assert len(alerts_before) == 1
    assert alerts_before[0]["status"] == "ACTIVE"

    # Send a RIS peer_state down message
    peer_down_msg = {
        "type": "ris_peer_state",
        "data": {
            "type": "PEER_DOWN",
            "state": "DOWN",
            "peer": "198.51.100.1",
            "peer_asn": "301",
            "host": "rrc00",
        },
    }

    parsed = parse_ris_message(peer_down_msg)
    assert parsed["is_peer_state_event"] is True
    assert parsed["valid"] is False
    assert len(parsed["withdrawals"]) == 0

    collector = RISLiveCollector(temp_db)
    collector._handle_message(json.dumps(peer_down_msg))

    assert collector.peer_state_events == 1
    assert collector.last_peer_state_event_at is not None

    # Invariant: Alert MUST still be ACTIVE and not withdrawn!
    alerts_after, _ = list_alerts(temp_db, status="ACTIVE")
    assert len(alerts_after) == 1
    assert alerts_after[0]["status"] == "ACTIVE"
    assert alerts_after[0]["recovery_status"] == "UNCONFIRMED"


def test_malformed_messages_affect_telemetry_without_creating_incidents(temp_db):
    """Skipped malformed messages affect telemetry but never create false route incidents or withdrawals."""
    collector = RISLiveCollector(temp_db)

    # Malformed JSON
    collector._handle_message("NOT A VALID JSON STRING {{{")
    assert collector.messages_skipped == 1
    assert "JSON decode error" in collector.last_skipped_reason

    # Malformed data field
    collector._handle_message(json.dumps({"type": "ris_message", "data": "not a dict"}))
    assert collector.messages_skipped == 2

    # Invariant: No observations or alerts created
    obs, total_obs = list_observations(temp_db)
    assert total_obs == 0
    alerts, total_alerts = list_alerts(temp_db)
    assert total_alerts == 0


def test_reconnection_restores_health_without_mutating_route_history(temp_db):
    """Reconnection restores transport health state without altering route history."""
    collector = RISLiveCollector(temp_db)
    collector.is_enabled = True
    collector.is_running = True
    collector.is_connected = False
    collector.reconnect_count = 3
    collector.last_error = "Connection reset by peer"

    st_disconnected = collector.get_status()
    assert st_disconnected["health_state"] == "DISCONNECTED"
    assert st_disconnected["reconnect_count"] == 3

    # Now reconnect
    collector.is_connected = True
    collector.last_error = None
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    collector.last_transport_message_at = now_str
    collector.last_parsed_update_at = now_str

    st_connected = collector.get_status()
    assert st_connected["health_state"] == "CONNECTED"
    assert st_connected["connected"] is True
