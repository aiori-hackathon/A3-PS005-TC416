# HORA-Q: Proposed vs. Built vs. Verified — Traceability & Acceptance Report

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor with Post-Quantum Evidence)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security  
**Problem Statement**: PS-005 — Autonomous BGP Route Hijacking and Route Leak Monitor  
**Team**: `A3-PS005-TC416`  
**Repository**: [https://github.com/aiori-hackathon/A3-PS005-TC416](https://github.com/aiori-hackathon/A3-PS005-TC416)  
**Verification Date**: October 26, 2026  
**Status**: Real-World Validated Prototype (Live RIPE RIS Ingestion, Real RPKI Validation, 2 Completed Historical Attack Replays + 1 Incomplete Data Evaluation, Append-Only Versioned Baseline History, Hardened Candidate Seeding Authorization, Per-Peer Recovery Tracking, 90 Automated Tests)

---

## 1. Executive Summary & Review Corrections

Following independent gap analysis against the official proposal (*HORA Q — Explainable BGP Anomaly Monitor (AIORI-3 Proposal)*), HORA-Q underwent a correctness-first remediation pass addressing key architectural concerns:

1. **Trusted Baseline Authorization**:
   - Baseline trust decisions no longer accept caller-controlled scenario strings (e.g. containing `"seed"` or `"baseline"`) or request metadata flags (e.g. `raw_metadata.trusted_seed`).
   - Normal observations arriving via `POST /api/v1/observations` are strictly quarantined as `CANDIDATE`.
   - Dedicated authorized seeding endpoint `POST /api/v1/baselines/seed` (protected by admin authentication in demo mode) is the only path that can establish an immediately `PROMOTED` baseline.
   - Regression tests prove attempted seed escalation is blocked in both demo and standard modes.

2. **Versioned Baseline History (Proposal D2)**:
   - Implemented an immutable append-only `baseline_history` table recording timestamp, prior status, new status, transition type, triggering observation ID, peer count, observation count, actor, and decision reason.
   - Initial candidate creation, corroborated promotions, peer withdrawals, and rejected anomaly attacks leave an auditable historical trail queryable via `GET /api/v1/baselines/history` and `GET /api/v1/routes/{prefix}/history`.

3. **Withdrawal Recovery Hardening**:
   - Unknown peer withdrawals (`peer_as=None`) are strictly prohibited from resolving alerts; they leave recovery unconfirmed (`ACTIVE` / `UNCONFIRMED`).
   - Alerts resolve only when all active observing peers for that alert have withdrawn.
   - Non-withdrawn peers remain active (`ACTIVE` / `PARTIAL`). Unrelated peer withdrawals and duplicate withdrawals leave alert states intact.
   - Verified against actual persisted database states rather than simple counters.

4. **Cryptographic Claims Precision**:
   - Active runtime provider is transparently reported as `dilithium-py (NIST FIPS 204)` with algorithm `ML-DSA-65`.
   - Distinct statuses are reported for `SIGNED` versus `UNSIGNED` evidence records.
   - Signature verification mathematically establishes payload integrity and signer identity under public-key trust assumptions—it does *not* prove that the external BGP observation was truthful.

---

## 2. Standardized Verification Matrix

The proposal dimensions and their verified statuses are classified below:

| Proposal Dimension | Status | Verification Detail & Technical Reason |
| :--- | :---: | :--- |
| **Prefix/ASN Normalization & Core Detection** | **VERIFIED within defined scope** | Implemented deterministic normalization (RFC 5952, RFC 4271/RFC 6793) and automated tests covering origin conflicts and more-specific subprefix anomalies. |
| **Historical Observation Storage** | **VERIFIED for current SQLite implementation** | All BGP updates and withdrawals are persisted with timestamps, peers, and collector provenance. Documented scaling limits apply to single-node SQLite. |
| **Versioned Baseline History** | **PARTIALLY IMPLEMENTED (History Table Built)** | An append-only `baseline_history` table tracks candidate creation, promotion, withdrawal, and rejected anomaly attempts. Multi-region distributed version replication is out of current scope. |
| **Candidate Promotion** | **PARTIALLY VERIFIED** | Peer-diversity threshold (`>= 2` peers AND `>= 3` observations) is verified; trusted-seed authorization is hardened via explicit authenticated endpoint. |
| **Explainability & Evidence Correlation** | **PARTIALLY VERIFIED** | Deterministic rule explanations, peer agreement counts, and confidence heuristics (`HIGH`, `MEDIUM`) exist; does not constitute a comprehensive root-cause classifier. |
| **Cryptographic Evidence** | **VERIFIED with conditions** | RFC 8785 canonical hash and NIST FIPS 204 ML-DSA-65 signing/verification verified. Signature proves integrity and key attribution under key custody assumptions, not observation truth. |
| **Historical Attack Replay** | **PARTIALLY VERIFIED** | Two complete attack replay cases are verified (YouTube/PTCL subprefix hijack and RTComm/Twitter origin conflict); Indosat 2011 is documented as an incomplete data evaluation. |
| **Live BGP Telemetry** | **VERIFIED for recorded ingestion run** | The recorded RIPE RIS Live run captured 195 normalized announcements. Zero withdrawals occurred during that 12.2s run; withdrawal processing is verified via archival and unit tests. |
| **RPKI Inspection** | **VERIFIED as an on-demand capability** | Live `VALID`, `INVALID`, and `UNKNOWN` responses are captured from RIPEstat; RPKI serves as an on-demand inspection tool, not an automatic blocker in every detection decision. |
| **Frontend Compilation** | **VERIFIED** | CI and local builds pass `tsc && vite build` with zero errors. This verifies component compilation, not full end-to-end verification against a deployed production cluster. |
| **Public Hosting** | **NOT YET VERIFIED** | Production Dockerfile, Railway configuration, and deployment guides are complete; live public URL remains unverified pending external hosting allocation. |
| **Full AS-Path Route-Leak Detection** | **OUT OF CURRENT SCOPE** | RFC 7908 valley-free route leaks where origin and prefix length do not change are intentionally excluded, as they require ASPA or BGPsec to detect. |

---

## 3. Real-World Internet Routing Data Proof

### 3.1. Live RIPE RIS WebSocket Ingestion
- **Target Feed**: `wss://ris-live.ripe.net/v1/ws/?client=horaq-tc416`
- **Execution Evidence**: Captured in [`audit/live_ris_telemetry.json`](audit/live_ris_telemetry.json)
- **Scope Limit**: Live announcement ingestion is verified (113 messages received, 195 announcements normalized). The recorded live session lasted 12.22s and saw zero withdrawals; withdrawal handling is independently tested.

### 3.2. Live RPKI Origin Validation via RIPEstat
- **Provider**: RIPE NCC RIPEstat Data API (`https://stat.ripe.net/data/rpki-validation/data.json`)
- **Execution Evidence**: Captured in [`audit/live_rpki_evidence.json`](audit/live_rpki_evidence.json)
- **Recorded Outcomes**:
  1. `1.1.1.0/24` with origin `AS13335` $\to$ `VALID` (Matching ROA).
  2. `1.1.1.0/24` with origin `AS99999` $\to$ `INVALID` (Conflicting origin ASN).
  3. `192.0.2.0/24` with origin `AS64496` $\to$ `UNKNOWN` (No ROA published).

### 3.3. Historical Incident Evaluations
- **Completed Attack Replay 1**: YouTube Subprefix Hijack (Feb 24, 2008) — 28 MRT records replayed; 27/27 alerts detected; 0.0s detection delay; withdrawal from AS3333 resolved matching 7 alerts while 20 alerts remained active.
- **Completed Attack Replay 2**: RTComm / Twitter Origin Hijack (Mar 28, 2022) — Pre-incident baseline established; rogue origin AS8342 detected immediately.
- **Incomplete Data Evaluation**: Indosat Route Leak (Jan 14, 2011) — Archive `updates.20110114.1215.gz` from `rrc00` contained 0 announcements for `8.8.8.0/24` because upstream providers filtered the leak before reaching this collector. Documented transparently as `INCOMPLETE_DATA`.
- **Benign Control**: RIPE RIS `rrc00/updates.20080224.1845.gz` — 20 announcements, 15 withdrawals; 0 false positives; 15 withdrawal state rows persisted.

---

## 4. Head-to-Head Reference Benchmark Summary

Proposal Page 6 defines an empirical comparison between a **Naïve Reference Detector** and **Enhanced HORA-Q**. Evaluated via [`backend/horaq/benchmark.py`](backend/horaq/benchmark.py) and documented in [`audit/reference_detector_comparison.json`](audit/reference_detector_comparison.json):

> [!NOTE]
> **Controlled Benchmark Label**: This 14-case testbed evaluates algorithmic differentiation under identical detection geometry. Both models achieve equal classification metrics (Precision: 80.0%, Recall: 100.0%, F1: 0.8889, FPR: 10.0%) on the calibrated stream. The critical advantage of Enhanced HORA-Q is **0.0% baseline contamination** (versus 75.0% for the naïve detector) and strict candidate quarantine against single-peer route flapping.

### Cryptographic Overhead Measurement (50 Iterations on Local CPU)
- **ML-DSA-65 (NIST FIPS 204)**: 3,309-byte signature, 1,952-byte public key. Mean sign latency: 81.69 ms; mean verify latency: 13.85 ms.
- **Ed25519 (Classical RFC 8032)**: 64-byte signature, 32-byte public key. Mean sign latency: 0.047 ms; mean verify latency: 0.144 ms.
- **RSA-2048 (Classical PKCS #1)**: 256-byte signature, 294-byte public key. Mean sign latency: 0.725 ms; mean verify latency: 0.051 ms.
- **Overhead Tradeoff**: ML-DSA-65 signatures are ~3.3 KB (~52× larger than Ed25519). Because signatures are generated per-alert/evidence entry rather than wire-rate packet, this storage overhead is operationally acceptable to achieve quantum resistance.

---

## 5. Summary Conclusion

HORA-Q implements the core BGP monitoring workflow (normalization, origin-conflict detection, subprefix-containment detection, evidence canonicalization, ML-DSA-65 signing, and standalone CLI verification) alongside several advanced mechanisms (candidate baseline quarantine, per-peer withdrawal recovery, and append-only baseline history).

In keeping with rigorous scientific standards:
- It does **not** claim complete root-cause route-leak attribution (valley-free path leaks remain out of scope).
- It reports **two** successfully completed attack replays and **one** incomplete data evaluation.
- It clarifies that digital signatures verify payload integrity and signer identity under public-key trust assumptions, rather than proving the external truth of the source BGP telemetry.
- External public deployment remains **not yet verified** until live endpoints are hosted.
