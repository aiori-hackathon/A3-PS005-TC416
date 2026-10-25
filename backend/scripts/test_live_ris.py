"""Test genuine live BGP ingestion from RIPE RIS Live WebSocket.

Connects to wss://ris-live.ripe.net/v1/ws/?client=horaq-tc416,
subscribes to live BGP announcements, parses them through RISLiveCollector,
records telemetry, and saves a sanitized evidence sample to audit/live_ris_telemetry.json.
"""

import asyncio
import json
import os
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from horaq.collector import RISLiveCollector, parse_ris_message
from horaq.database import init_db



async def run_live_test(duration_seconds: int = 15):
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting live RIPE RIS WebSocket collection (target window: {duration_seconds}s)...")
    
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(db_path)

    collector = RISLiveCollector(db_path=db_path)
    collector.is_enabled = True

    sample_messages = []
    
    # Intercept _handle_message to collect samples
    original_handle = collector._handle_message

    def logging_handle(raw_str):
        if len(sample_messages) < 5:
            try:
                data = json.loads(raw_str)
                sample_messages.append({
                    "raw_sample_id": len(sample_messages) + 1,
                    "type": data.get("type"),
                    "peer": data.get("data", {}).get("peer"),
                    "host": data.get("data", {}).get("host"),
                    "path": data.get("data", {}).get("path"),
                    "announcements_count": len(data.get("data", {}).get("announcements", [])),
                    "withdrawals_count": len(data.get("data", {}).get("withdrawals", [])),
                })
            except Exception:
                pass
        original_handle(raw_str)

    collector._handle_message = logging_handle

    start_time = time.time()
    await collector.start()

    # Allow session to connect and collect messages for the duration window
    while time.time() - start_time < duration_seconds:
        if collector.messages_received >= 30:
            break
        await asyncio.sleep(0.5)

    await collector.stop()
    elapsed = time.time() - start_time

    status = collector.get_status()
    print(f"Connection & collection duration: {elapsed:.2f}s")
    print(f"Status: {json.dumps(status, indent=2)}")

    evidence = {
        "test_name": "RIPE_RIS_LIVE_INGESTION",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "target_url": collector.url,
        "duration_seconds": round(elapsed, 2),
        "telemetry": status,
        "samples_captured": sample_messages,
        "verdict": "VERIFIED" if status["messages_received"] > 0 else "NOT_VERIFIED",
    }

    audit_dir = backend_dir.parent / "audit"
    os.makedirs(audit_dir, exist_ok=True)
    out_file = audit_dir / "live_ris_telemetry.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(evidence, f, indent=2)

    print(f"Saved evidence to {out_file}")

    # Cleanup temp db
    if os.path.exists(db_path):
        os.remove(db_path)

    if status["messages_received"] == 0:
        print("WARNING: No messages received from RIPE RIS Live.")
        sys.exit(1)
    else:
        print(f"SUCCESS: Received {status['messages_received']} live messages, parsed {status['messages_parsed']}, skipped {status['messages_skipped']}.")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(run_live_test())
