# HORA-Q — Technical Documentation Suite

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

This directory contains the consolidated, authoritative technical documentation for HORA-Q.

---

## 📚 Technical Documentation Index

| Document | Primary Topics Covered |
| :--- | :--- |
| **[1. Architecture & Design](ARCHITECTURE.md)** | System pipeline (Discover ➔ Normalize ➔ Baseline ➔ Detect ➔ Explain ➔ Notarize ➔ Verify), component boundaries, technology choices. |
| **[2. Detection & Baselines](DETECTION_AND_BASELINES.md)** | Baseline state machine (`CANDIDATE` ➔ `PROMOTED`), anti-poisoning barriers, peer diversity invariant, versioned baseline history, origin-AS conflict & subprefix detection algorithms, per-peer withdrawal recovery. |
| **[3. API & Data Model](API_AND_DATA_MODEL.md)** | Complete REST API specification (`/api/v1`), request/response schemas, SQLite schema (WAL mode, parameterized queries). |
| **[4. Evidence & Cryptography](EVIDENCE_AND_CRYPTOGRAPHY.md)** | RFC 8785 JSON Canonicalization Scheme (JCS), SHA-256 digest binding, NIST FIPS 204 ML-DSA-65 post-quantum lattice signatures, persistent authority key lifecycle, independent CLI verifier (`verify_evidence.py`). |
| **[5. Testing & Evaluation](TESTING_AND_EVALUATION.md)** | 93 automated pytest tests, 14-case head-to-head reference detector benchmark (0.0% vs 75.0% baseline contamination), live CPU cryptographic benchmarks, archival MRT historical replays. |
| **[6. Evaluator Demo Guide](DEMO_GUIDE.md)** | Quickstart instructions, 6-stage interactive evaluator guided walkthrough, CLI verification demos, public demo protections. |
| **[7. Threat Model & Boundaries](THREAT_MODEL_AND_LIMITATIONS.md)** | Threat analysis (origin hijacks, subprefix LPM exploitation, baseline poisoning, evidence forgery), architectural scope boundaries (RFC 7908 valley leaks), cryptographic truth vs telemetry truth. |
| **[8. Operations & Deployment](OPERATIONS.md)** | Configuration parameters, environment variables, SQLite WAL maintenance, live RIPE RIS WebSocket collector, CI pipeline specification. |

---

## Supporting Audit & Verification Resources
- **Audit Reports**: [`audit/`](../audit/) — Implementation matrix, security reviews, test logs, and 16:9 UI screenshots.
- **Independent Verifier**: [`verify_evidence.py`](../verify_evidence.py) — Standalone command-line evidence verification tool.
- **Reference Comparison**: [`audit/reference_detector_comparison.json`](../audit/reference_detector_comparison.json) — Head-to-head benchmark metrics.
- **Historical Replay Log**: [`audit/historical_attack_validation.json`](../audit/historical_attack_validation.json) — Archival MRT replay outcomes.
