"""Unit tests for RIPE RIS Live Collector and message parsing.

Tests compliance with Phase 2 requirements:
- Deterministic parsing for standard AS paths
- Terminal AS_SET handling (RFC 4271/RFC 6472)
- Multi-origin AS_SET disambiguation / rejection
- BGP withdrawals recognition
- Non-update / malformed / missing-field messages
- Duplicate prefix deduplication
- Collector telemetry tracking and reconnect counts
"""

import json
import pytest
from horaq.collector import parse_ris_message, RISLiveCollector, get_collector_telemetry


def test_parse_standard_as_path():
    """Standard sequence AS_PATH with single origin ASN."""
    msg = {
        "type": "ris_message",
        "data": {
            "timestamp": 1698240000.5,
            "peer": "193.0.0.1",
            "host": "rrc00",
            "path": [174, 3356, 13335],
            "announcements": [
                {
                    "next_hop": "193.0.0.1",
                    "prefixes": ["1.1.1.0/24", "1.0.0.0/24"],
                }
            ],
        },
    }
    res = parse_ris_message(msg)
    assert res["valid"] is True
    assert len(res["announcements"]) == 2
    assert res["announcements"][0]["origin_asn"] == 13335
    assert res["announcements"][0]["prefix"] == "1.1.1.0/24"
    assert res["announcements"][0]["metadata"]["terminal_as_set"] is False
    assert res["announcements"][0]["metadata"]["path_length"] == 3
    assert res["as_set_handled"] == 0
    assert res["as_set_skipped"] == 0


def test_parse_single_element_as_set():
    """Terminal AS_SET containing exactly one ASN (unwrapped safely)."""
    msg = {
        "type": "ris_message",
        "data": {
            "timestamp": 1698240001.0,
            "peer": "193.0.0.2",
            "host": "rrc01",
            "path": [174, [13335]],  # Terminal single-element AS_SET
            "announcements": [
                {
                    "next_hop": "193.0.0.2",
                    "prefixes": ["1.1.1.0/24"],
                }
            ],
        },
    }
    res = parse_ris_message(msg)
    assert res["valid"] is True
    assert len(res["announcements"]) == 1
    assert res["announcements"][0]["origin_asn"] == 13335
    assert res["announcements"][0]["metadata"]["terminal_as_set"] is True
    assert res["announcements"][0]["metadata"]["as_set_members"] == [13335]
    assert res["as_set_handled"] == 1
    assert res["as_set_skipped"] == 0


def test_parse_multi_element_as_set_skipped():
    """Terminal AS_SET with multiple ASNs is skipped per RFC 6472 (ambiguous origin)."""
    msg = {
        "type": "ris_message",
        "data": {
            "timestamp": 1698240002.0,
            "peer": "193.0.0.3",
            "host": "rrc02",
            "path": [174, [13335, 13336, 13337]],  # Ambiguous multi-element AS_SET
            "announcements": [
                {
                    "next_hop": "193.0.0.3",
                    "prefixes": ["1.1.1.0/24"],
                }
            ],
        },
    }
    res = parse_ris_message(msg)
    assert res["valid"] is False
    assert len(res["announcements"]) == 0
    assert res["as_set_handled"] == 0
    assert res["as_set_skipped"] == 1
    assert "RFC 6472" in res["skipped_reason"]
    assert "origin ambiguous" in res["skipped_reason"]


def test_parse_empty_as_set():
    """Terminal AS_SET that is empty is rejected."""
    msg = {
        "type": "ris_message",
        "data": {
            "path": [174, []],
            "announcements": [{"prefixes": ["1.1.1.0/24"]}],
        },
    }
    res = parse_ris_message(msg)
    assert res["valid"] is False
    assert res["as_set_skipped"] == 1
    assert "empty" in res["skipped_reason"].lower()


def test_parse_withdrawal_only_message():
    """Pure withdrawal update is detected and counted, without creating route announcements."""
    msg = {
        "type": "ris_message",
        "data": {
            "timestamp": 1698240003.0,
            "peer": "193.0.0.4",
            "host": "rrc03",
            "withdrawals": ["192.0.2.0/24", "198.51.100.0/24"],
            "announcements": [],
        },
    }
    res = parse_ris_message(msg)
    assert res["valid"] is True
    assert len(res["announcements"]) == 0
    assert len(res["withdrawals"]) == 2
    assert "192.0.2.0/24" in res["withdrawals"]
    assert "withdrawal" in res["skipped_reason"].lower()


def test_parse_duplicate_prefixes_deduplication():
    """Duplicate prefixes in the same announcement list are deduplicated."""
    msg = {
        "type": "ris_message",
        "data": {
            "timestamp": 1698240004.0,
            "path": [174, 64496],
            "announcements": [
                {"prefixes": ["192.0.2.0/24", "192.0.2.0/24", "192.0.2.0/24"]},
                {"prefixes": ["192.0.2.0/24", "198.51.100.0/24"]},
            ],
        },
    }
    res = parse_ris_message(msg)
    assert res["valid"] is True
    assert len(res["announcements"]) == 2
    prefixes = [a["prefix"] for a in res["announcements"]]
    assert prefixes == ["192.0.2.0/24", "198.51.100.0/24"]


def test_parse_missing_as_path():
    """Announcement lacking AS_PATH is rejected."""
    msg = {
        "type": "ris_message",
        "data": {
            "path": [],
            "announcements": [{"prefixes": ["1.1.1.0/24"]}],
        },
    }
    res = parse_ris_message(msg)
    assert res["valid"] is False
    assert "Missing or empty AS_PATH" in res["skipped_reason"]


def test_parse_non_update_message_types():
    """Non-ris_message types (such as ris_error or ping) are properly skipped."""
    msg = {"type": "ris_error", "data": {"message": "Invalid client"}}
    res = parse_ris_message(msg)
    assert res["valid"] is False
    assert "Non-update message type" in res["skipped_reason"]


def test_collector_telemetry_tracking():
    """RISLiveCollector tracks counters for parsing, skipping, withdrawals, and AS_SETs."""
    import tempfile
    import os
    from horaq.database import init_db

    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(db_path)

    try:
        collector = RISLiveCollector(db_path=db_path)
        status = collector.get_status()
        assert status["messages_received"] == 0
        assert status["messages_parsed"] == 0
        assert status["messages_skipped"] == 0
        assert status["withdrawals_received"] == 0
        assert status["as_set_handled"] == 0
        assert status["as_set_skipped"] == 0

        # Feed 1: Valid standard announcement
        valid_msg = json.dumps({
            "type": "ris_message",
            "data": {
                "timestamp": 1698240010.0,
                "path": [174, 64496],
                "announcements": [{"prefixes": ["192.0.2.0/24"]}],
            },
        })
        collector._handle_message(valid_msg)
        assert collector.messages_parsed == 1

        # Feed 2: Multi-origin AS_SET (should be skipped and counted)
        as_set_msg = json.dumps({
            "type": "ris_message",
            "data": {
                "path": [174, [64496, 64497]],
                "announcements": [{"prefixes": ["198.51.100.0/24"]}],
            },
        })
        collector._handle_message(as_set_msg)
        assert collector.as_set_skipped == 1
        assert collector.messages_skipped == 1
        assert "RFC 6472" in collector.last_skipped_reason

        # Feed 3: Withdrawal
        withdrawn_msg = json.dumps({
            "type": "ris_message",
            "data": {
                "withdrawals": ["203.0.113.0/24"],
                "announcements": [],
            },
        })
        collector._handle_message(withdrawn_msg)
        assert collector.withdrawals_received == 1

        # Feed 4: Malformed JSON
        collector._handle_message("{invalid-json")
        assert collector.messages_skipped == 2
        assert "JSON decode error" in collector.last_skipped_reason

        status = collector.get_status()
        assert status["messages_parsed"] == 1
        assert status["messages_skipped"] == 2
        assert status["withdrawals_received"] == 1
        assert status["as_set_skipped"] == 1
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
