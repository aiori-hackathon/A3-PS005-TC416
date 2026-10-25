"""Collect verifiable evidence for Live RPKI and Historical BGP Replay.

Adheres to Phases 3 & 4 of the Acceptance Readiness specification:
- Real RIPEstat RPKI queries with live responses, timestamps, and parameters.
- Replay of documented historical incidents (YouTube PTCL, Indosat, Rostelecom) + controls.
- Stores auditable reports in audit/live_rpki_evidence.json and audit/historical_replay_evidence.json.
"""

import asyncio
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import httpx

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from horaq.database import db_session, init_db
from horaq.detection import process_observation
from horaq.rpki import check_rpki_origin_validation


async def run_live_rpki_suite():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Running Live RPKI Validation against RIPEstat API...")

    test_cases = [
        {
            "case_id": "RPKI-LIVE-VALID",
            "prefix": "1.1.1.0/24",
            "origin_asn": "AS13335",
            "expected_state": "VALID",
            "description": "Cloudflare primary DNS route with valid signed ROA",
        },
        {
            "case_id": "RPKI-LIVE-INVALID-ASN",
            "prefix": "1.1.1.0/24",
            "origin_asn": "AS99999",
            "expected_state": "INVALID",
            "description": "Cloudflare route tested against wrong origin ASN (ROA mismatch)",
        },
        {
            "case_id": "RPKI-LIVE-UNKNOWN",
            "prefix": "192.0.2.0/24",
            "origin_asn": "AS64496",
            "expected_state": "UNKNOWN",
            "description": "RFC 5737 TEST-NET-1 documentation prefix with no published ROA",
        },
    ]

    results = []

    for tc in test_cases:
        p = tc["prefix"]
        asn = tc["origin_asn"]
        ts_start = datetime.now(timezone.utc).isoformat()
        
        # 1. Direct query to RIPEstat for raw response preservation
        asn_clean = asn.upper().replace("AS", "")
        ripestat_url = f"https://stat.ripe.net/data/rpki-validation/data.json?resource={asn_clean}&prefix={p}"
        raw_payload = None
        http_status = None
        error_msg = None

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(ripestat_url)
                http_status = resp.status_code
                if resp.is_success:
                    raw_payload = resp.json()
        except Exception as err:
            error_msg = str(err)

        # 2. HORA-Q RPKI client validation
        horaq_result = await check_rpki_origin_validation(prefix=p, asn=asn)

        matched = (horaq_result.get("status") == tc["expected_state"])
        print(f"  {tc['case_id']}: {p} @ {asn} -> HORA-Q state '{horaq_result.get('status')}' (Expected: '{tc['expected_state']}', Matched: {matched})")

        results.append({
            "case_id": tc["case_id"],
            "description": tc["description"],
            "query_timestamp_utc": ts_start,
            "prefix": p,
            "origin_asn": asn,
            "target_url": ripestat_url,
            "http_status": http_status,
            "expected_state": tc["expected_state"],
            "horaq_state": horaq_result.get("status"),
            "matched_expected": matched,
            "horaq_full_response": horaq_result,
            "raw_ripestat_data": raw_payload.get("data") if raw_payload else None,
            "error": error_msg,
        })

    # Save to audit/live_rpki_evidence.json
    audit_dir = backend_dir.parent / "audit"
    os.makedirs(audit_dir, exist_ok=True)
    rpki_out_file = audit_dir / "live_rpki_evidence.json"

    with open(rpki_out_file, "w", encoding="utf-8") as f:
        json.dump({
            "test_name": "RIPE_STAT_LIVE_RPKI_VALIDATION",
            "execution_timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "provider": "RIPE NCC RIPEstat Data API",
            "total_cases": len(results),
            "passed_cases": sum(1 for r in results if r["matched_expected"]),
            "cases": results,
            "verdict": "VERIFIED" if all(r["matched_expected"] for r in results) else "PARTIALLY_VERIFIED",
        }, f, indent=2)

    print(f"Saved Live RPKI evidence to {rpki_out_file}")
    return results


def run_historical_replay_suite():
    print(f"\n[{datetime.now(timezone.utc).isoformat()}] Running Historical BGP Incident Replay Suite...")

    audit_dir = backend_dir.parent / "audit"
    samples_file = audit_dir / "historical_incident_samples.json"
    if not samples_file.exists():
        raise FileNotFoundError(f"Missing {samples_file}")

    with open(samples_file, "r", encoding="utf-8") as f:
        samples = json.load(f)

    replay_results = []

    for incident in samples:
        inc_id = incident["incident_id"]
        inc_name = incident["name"]
        baseline_info = incident["ground_truth_baseline"]
        announcement = incident["incident_announcement"]
        expected = incident["expected_result"]

        # Run each incident in an isolated clean DB
        fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        init_db(db_path)

        try:
            # 1. Establish trusted ground-truth baseline
            seed_res = process_observation(
                db_path=db_path,
                prefix_raw=baseline_info["prefix"],
                origin_asn_raw=baseline_info["origin_asn"],
                collector="baseline-seed",
                timestamp_raw="2000-01-01T00:00:00Z",
                scenario="baseline-seed",
            )
            assert len(seed_res["alerts"]) == 0, "Baseline seeding must never generate alerts"

            # 2. Replay the incident announcement
            obs_res = process_observation(
                db_path=db_path,
                prefix_raw=announcement["prefix"],
                origin_asn_raw=announcement["origin_asn"],
                collector=announcement.get("collector", "replay-archive"),
                timestamp_raw=announcement.get("timestamp"),
                scenario=inc_id,
            )

            alerts = obs_res["alerts"]

            # 3. Check baseline integrity (poisoning check)
            with db_session(db_path) as conn:
                base_rows = conn.execute("SELECT prefix, origin_asn FROM baselines;").fetchall()
                base_dict = {r["prefix"]: r["origin_asn"] for r in base_rows}

            # Baseline for original prefix must remain unchanged
            orig_base = base_dict.get(baseline_info["prefix"])
            baseline_preserved = (orig_base == f"AS{baseline_info['origin_asn']}")

            # If it's a subprefix attack, the attack subprefix must NOT be in baselines
            if expected.get("alert_kind") == "SUBPREFIX_ANOMALY":
                subprefix_poisoned = announcement["prefix"] in base_dict
            else:
                subprefix_poisoned = False

            poison_check_passed = baseline_preserved and not subprefix_poisoned

            # 4. Check alert expectations
            if expected.get("alert_kind") is None:
                # Control case expecting 0 alerts
                alert_check_passed = (len(alerts) == 0)
                detected_kind = None
                detected_severity = None
            else:
                alert_check_passed = (
                    len(alerts) >= 1
                    and alerts[0]["kind"] == expected["alert_kind"]
                    and alerts[0]["severity"] == expected["severity"]
                )
                detected_kind = alerts[0]["kind"] if alerts else None
                detected_severity = alerts[0]["severity"] if alerts else None

            overall_passed = alert_check_passed and poison_check_passed
            print(f"  {inc_id} ({inc_name}):")
            print(f"    Alert Match: {alert_check_passed} (Kind: {detected_kind}, Expected: {expected.get('alert_kind')})")
            print(f"    Baseline Poisoning Protected: {poison_check_passed}")
            print(f"    Overall: {'PASSED' if overall_passed else 'FAILED'}")

            replay_results.append({
                "incident_id": inc_id,
                "name": inc_name,
                "date": incident.get("date"),
                "references": incident.get("public_references"),
                "ground_truth_baseline": baseline_info,
                "incident_announcement": announcement,
                "expected": expected,
                "alerts_detected_count": len(alerts),
                "detected_kind": detected_kind,
                "detected_severity": detected_severity,
                "evidence_record_generated": bool(alerts and alerts[0].get("evidence")),
                "baseline_poison_protected": poison_check_passed,
                "passed": overall_passed,
            })

        finally:
            if os.path.exists(db_path):
                os.remove(db_path)

    replay_out_file = audit_dir / "historical_replay_evidence.json"
    with open(replay_out_file, "w", encoding="utf-8") as f:
        json.dump({
            "test_name": "HISTORICAL_BGP_INCIDENT_REPLAY",
            "execution_timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "total_incidents_replayed": len(replay_results),
            "passed": sum(1 for r in replay_results if r["passed"]),
            "false_positive_control_passed": any(r["incident_id"] == "CONTROL-LEGITIMATE-SAME-ORIGIN-UPDATE" and r["passed"] for r in replay_results),
            "incidents": replay_results,
            "verdict": "VERIFIED" if all(r["passed"] for r in replay_results) else "PARTIALLY_VERIFIED",
        }, f, indent=2)

    print(f"Saved Historical Replay evidence to {replay_out_file}")
    return replay_results


if __name__ == "__main__":
    rpki_res = asyncio.run(run_live_rpki_suite())
    replay_res = run_historical_replay_suite()
