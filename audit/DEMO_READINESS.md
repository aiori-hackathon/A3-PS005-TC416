# HORA-Q — Demonstration Readiness Guide

**Project**: HORA Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. Demonstration Overview

HORA Q is **100% demo-ready** for evaluation by hackathon judges and security engineers. The system supports both real-time interactive UI testing and automated end-to-end scenario execution via REST endpoints.

---

## 2. Interactive Scenarios for Evaluators

### Scenario 1: Legitimate Baseline Seeding & Stability (Normal Route)
1. **Action**: In the UI, click **"Scan now"** or click **"Baselines"** in the sidebar.
2. **Behavior**: Shows tracked prefix `198.51.100.0/24` with origin `AS64496` and `observation_count: 1`.
3. **Expected Result**: System protected banner remains green. Zero false-positive alerts are fired.

### Scenario 2: Origin-AS Conflict Detection (BGP Origin Hijack)
1. **Action**: Click on **"Scenarios"** in the sidebar and click **"Run Origin Shift Attack"** (or execute `POST /api/v1/scenarios/origin-change`).
2. **Behavior**: Rogue AS `AS64511` announces `198.51.100.0/24` conflicting with legitimate baseline `AS64496`.
3. **Expected Result**:
   - Status pill in header switches to red: **"Threats active"**.
   - An alert appears in **"Alerts"**: `Origin-AS Conflict: 198.51.100.0/24 (Observed AS64511 vs Baseline AS64496)`.
   - The baseline table is **preserved and not poisoned**.
   - Operator can click **"Block"** to filter the route or **"Ack"** to acknowledge.

### Scenario 3: More-Specific Subprefix Anomaly (LPM Traffic Drain)
1. **Action**: Click on **"Scenarios"** and execute **"Subprefix Infiltration"** (`POST /api/v1/scenarios/subprefix`).
2. **Behavior**: Rogue AS `AS64505` announces `2001:db8:1::/48` subnet `2001:db8:1:a::/64`.
3. **Expected Result**:
   - Detects strict subnet containment via Python `ipaddress`.
   - Generates an explainable alert linking the covering parent prefix `2001:db8:1::/48` and explaining the **RFC 1812 Longest Prefix Match** mechanism.

### Scenario 4: Cryptographic Evidence Notarization & Tamper Simulation
1. **Action**: On any alert, click **"Evidence"** to open the Cryptographic Evidence Record.
2. **Behavior**:
   - Displays the 4-stage pipeline: `Ingest` ➔ `Canonicalize (RFC 8785)` ➔ `SHA-256 Digest` ➔ `ML-DSA-65 Seal`.
   - Shows the notarized vault SHA-256 digest.
   - Click **"Simulate tampering"**: Modifies the severity and origin ASN in memory. A high-contrast warning banner appears with a side-by-side field mutation diff.
   - Click **"Verify integrity"**: Recomputes SHA-256 over canonical UTF-8 bytes and immediately triggers the badge: **"Tamper detected: Hash mismatch"**.
   - Click **"Verify CLI"**: Copies the independent terminal verification command (`echo '<json>' | sha256sum`).

### Scenario 5: Live RPKI ROA Origin Validation
1. **Action**: Click on **"RPKI Inspector"** in the sidebar.
2. **Behavior**: Select the **"Cloudflare (Valid)"** preset (`1.1.1.0/24`, `AS13335`) and click **"Validate Origin"**.
3. **Expected Result**:
   - Live query to RIPEstat evaluates the route against public Regional Internet Registry trust anchors.
   - Returns status **VALID** and displays the validating ROA table with authorized origin ASN, max-length, and match validity.

---

## 3. Demonstration Script & Quick Commands

To run all scenarios in a single automated suite:
```powershell
curl -X POST http://127.0.0.1:8000/api/v1/scenarios/run-all
```
Returns a JSON summary of all 4 evaluated attack vectors with 100% detection rate.
