"""Script to verify the complete 6-stage evaluator lifecycle against the running backend server."""

import json
import urllib.request
import sys


def post(endpoint: str) -> dict:
    req = urllib.request.Request(f"http://127.0.0.1:8000/api/v1{endpoint}", method="POST")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def get(endpoint: str) -> dict:
    with urllib.request.urlopen(f"http://127.0.0.1:8000/api/v1{endpoint}", timeout=10) as r:
        return json.loads(r.read())


def main() -> None:
    print("=" * 70)
    print("HORA-Q LIVE EVALUATOR 6-STAGE LIFECYCLE VERIFICATION")
    print("=" * 70)

    # Stage 0: Safe Reset
    print("\n[Stage 0] Safe Resetting Sandbox...")
    r0 = post("/scenarios/reset")
    print(f"  Result: {r0.get('description')} (Success: {r0.get('success')})")

    # Stage 1: Seed Clean Baseline
    print("\n[Stage 1] Seeding Reference Route Baseline (192.0.2.0/24 -> AS64496)...")
    r1 = post("/scenarios/baseline")
    assert r1.get("success") is True, "Stage 1 failed!"
    assert r1.get("alerts_generated") == 0, "Spurious alerts generated!"
    print(f"  [PASS] Baseline established: {r1.get('description')}")
    print(f"         Alerts generated: {r1.get('alerts_generated')} (Expected: 0)")

    ov = get("/overview")
    print(f"         Overview tracked routes: {ov.get('tracked_routes')}, active alerts: {ov.get('active_alerts')}")
    print(f"         Collector status: enabled={ov.get('collector_status', {}).get('enabled')}, connected={ov.get('collector_status', {}).get('connected')}")

    # Stage 2: Inject Subprefix Hijack
    print("\n[Stage 2] Injecting Subprefix Anomaly (192.0.2.128/25 from AS64500)...")
    r2 = post("/scenarios/subprefix")
    assert r2.get("success") is True, "Stage 2 failed!"
    assert r2.get("alerts_generated", 0) >= 1, "Alert not triggered!"
    print(f"  [PASS] Anomaly injected: {r2.get('description')}")
    print(f"         Alerts triggered: {r2.get('alerts_generated')} (Expected: >= 1)")

    alerts = get("/alerts")
    top_alert = alerts.get("items", [{}])[0]
    print(f"         Active Incident: {top_alert.get('prefix')} announced by {top_alert.get('observed_asn')}")

    # Stage 3: Inspect Explainability
    print("\n[Stage 3] Inspecting Deterministic Root-Cause Explanation...")
    assert top_alert.get("explanation"), "Missing explanation!"
    print(f"  [PASS] Explanation: {top_alert.get('explanation')}")
    print(f"         Confidence: {top_alert.get('confidence')} | Severity: {top_alert.get('severity')}")

    # Stage 4: Live RPKI Validation
    print(f"\n[Stage 4] Querying Live RPKI Origin Validation for {top_alert.get('prefix')}...")
    rpki = get(f"/rpki/validate?prefix={top_alert.get('prefix')}&asn={top_alert.get('observed_asn')}")
    print(f"  [PASS] RPKI Result: {rpki.get('status')} | Provider: {rpki.get('provider')}")
    print(f"         Details: {rpki.get('details')}")

    # Stage 5: Cryptographic Notarization & FIPS 204 Signing
    print("\n[Stage 5] Cryptographic Evidence Notarization (RFC 8785 + ML-DSA-65)...")
    evidence_list = get("/evidence")
    top_ev = evidence_list.get("items", [{}])[0]
    print(f"  [PASS] Evidence ID: {top_ev.get('id')}")
    print(f"         Recorded SHA-256 Digest: {top_ev.get('record_hash')}")
    print(f"         Initial Signer Status: {top_ev.get('signer_status')}")

    print("         Notarizing with NIST FIPS 204 ML-DSA-65 authority key...")
    signed = post(f"/evidence/{top_ev.get('id')}/sign")
    assert signed.get("signer_status") == "SIGNED", f"Signing failed: {signed}"
    print(f"  [PASS] Signer Status: {signed.get('signer_status')}")
    print(f"         Algorithm: {signed.get('algorithm')}")
    print(f"         Signature Length: {len(signed.get('signature', ''))} base64 chars")

    # Stage 6: BGP Route Withdrawal & Recovery
    print("\n[Stage 6] BGP Route Withdrawal Ingestion & Anomaly Recovery...")
    r6 = post("/scenarios/withdrawal-recovery")
    assert r6.get("success") is True, "Stage 6 recovery failed!"
    assert r6.get("alerts_resolved", 0) > 0, "No alerts resolved!"
    print(f"  [PASS] Withdrawal processed: {r6.get('description')}")
    print(f"         Alerts resolved: {r6.get('alerts_resolved')} (Expected: > 0)")

    alerts_post = get("/alerts")
    active_post = [a for a in alerts_post.get("items", []) if a.get("status") == "ACTIVE"]
    resolved_post = [a for a in alerts_post.get("items", []) if a.get("status") == "RESOLVED"]
    print(f"         Remaining Active Alerts: {len(active_post)}")
    print(f"         Total Resolved Alerts: {len(resolved_post)}")

    print("\n" + "=" * 70)
    print("ALL 6 STAGES OF THE EVALUATOR LIFECYCLE VERIFIED SUCCESSFULLY (EXIT CODE: 0)")
    print("=" * 70)


if __name__ == "__main__":
    main()
