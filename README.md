# HORA-Q — Explainable BGP Origin and Subprefix Anomaly Monitor

[![CI](https://github.com/aiori-hackathon/A3-PS005-TC416/actions/workflows/ci.yml/badge.svg)](https://github.com/aiori-hackathon/A3-PS005-TC416/actions/workflows/ci.yml)
[![Team](https://img.shields.io/badge/Team-A3--PS005--TC416-indigo.svg)](https://github.com/aiori-hackathon/A3-PS005-TC416)
[![Track](https://img.shields.io/badge/AIORI--3-Track%202%20Cyber%20Security%20(PS--005)-cyan.svg)](https://github.com/aiori-hackathon/A3-PS005-TC416)
[![Tests](https://img.shields.io/badge/Tests-93%20Passed%20(100%25)-emerald.svg)](backend/tests)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/Deployment-Standby%20Guide-blueviolet.svg)](DEPLOYMENT.md)

---

## 1. Project Purpose & Team Identification

**HORA-Q** is an explainable Border Gateway Protocol (BGP) origin and subprefix anomaly monitoring architecture engineered for AIORI-3. The system normalizes BGP route announcements, maintains multi-peer corroborated baselines with an append-only version history, detects origin-AS shifts and more-specific subprefix announcements without baseline poisoning, tracks per-peer withdrawal recovery, binds findings into canonical forensic evidence records (RFC 8785 JSON + SHA-256), and provides **NIST FIPS 204 ML-DSA-65 post-quantum digital signatures** with independent command-line verification.

- **Hackathon**: AIORI-3 · Track 2 Cyber Security · Problem Statement PS-005
- **Team Code**: `A3-PS005-TC416`
- **Institution**: Al-Ameen College
- **Team Members**: Sankardev VS (Team Lead), Adarsh A (Team Member)
- **Faculty Mentor**: Dr. Jyothy Joseph
- **Team Introduction Video**: [https://youtu.be/oKoHllmyCMQ](https://youtu.be/oKoHllmyCMQ)
- **Project Proposals**:
  - [HORA Q — Explainable BGP Anomaly Monitor (AIORI-3 Proposal).pdf](HORA%20Q%20%E2%80%94%20Explainable%20BGP%20Anomaly%20Monitor%20%28AIORI-3%20Proposal%29.pdf)
  - [Proposed-structure-hackathon.pdf](Proposed-structure-hackathon.pdf)

---

## 2. Honest Operating & Deployment Status

- **Operating Modes**:
  - **SYNTHETIC (Default Demonstration Mode)**: Uses controlled RFC 5737 (`192.0.2.0/24`, `198.51.100.0/24`) and RFC 3849 (`2001:db8::/32`) testbed allocations for reliable, non-destructive evaluator demonstration.
  - **LIVE (Opt-in Stream)**: Connects to RIPE NCC RIS Live WebSocket (`wss://ris-live.ripe.net/v1/ws/`). Live ingestion is **disabled by default** to protect demonstration isolation and avoid external network dependencies during offline evaluations.
  - **HISTORICAL (Replay Mode)**: Evaluates archival MRT dumps from real-world historical incidents (e.g., Pakistan Telecom / YouTube AS36561 hijack).
- **Deployment Status**:
  - Standby production configuration documented in [`DEPLOYMENT.md`](DEPLOYMENT.md) for Cloudflare Pages (Frontend) and Railway (Backend with SQLite WAL persistence volume). Public live URLs are provisioned on demand.
- **Demo Security Safeguards**:
  - Public demo mode (`DEMO_MODE=true`) prevents unauthenticated callers from executing destructive database resets or tampering with baseline provenance.

---

## 3. Verified Capabilities & Technical Limitations

### Verified Capabilities
- **Multi-Peer Corroborated Baselines**: Transient single-peer route announcements enter as `CANDIDATE`; routes are promoted to `PROMOTED` only when corroborated across multiple vantage points (`peer_count >= 2` and `observation_count >= 3`).
- **Strict Anti-Poisoning Invariant**: Conflicting origin announcements and rogue subprefixes fire alerts and notarized evidence records, but are mathematically blocked from mutating established baseline origins.
- **Deterministic Longest-Prefix-Match Subprefix Detection**: Accurately flags unauthorized more-specific subnets (e.g., `/25` inside `/24`, `/48` inside `/32`) across IPv4 and IPv6.
- **Per-Peer Route Withdrawal Recovery**: Tracks route announcements per observing peer ASN. Incidents transition to `RESOLVED` only when all announcing peers submit corresponding BGP withdrawals.
- **RFC 8785 Canonical Serialization & SHA-256 Digest**: Serializes forensic evidence into byte-deterministic canonical JSON with immutable SHA-256 cryptographic binding.
- **NIST FIPS 204 ML-DSA-65 Post-Quantum Signatures**: Signs evidence records using post-quantum lattice cryptography (`dilithium-py`) with persistent authority keys.
- **Independent Command-Line Verification**: External verification script (`verify_evidence.py`) validates integrity and signatures outside the web application.

### Important Limitations
- **Control-Plane Focus**: HORA-Q monitors BGP control-plane updates. It does not perform data-plane traceroute probing or packet forwarding analysis.
- **AS-Path Valley Leaks**: Pure policy route leaks conforming to shortest-path valley rules (RFC 7908) without origin shifts or subprefixes are outside the primary origin/subprefix detector scope.
- **Single-Authority Signing**: Default signing relies on a local persistent authority key (`horaq_authority_key.json`). Production scaling requires an external Hardware Security Module (HSM) or KMS provider.
- **SQLite Concurrency Boundary**: SQLite WAL handles hundreds of writes/sec; multi-collector carrier-scale deployments (>50,000 msgs/sec) require PostgreSQL or distributed time-series storage.

---

## 4. Architecture Summary

```
                       BGP Telemetry Ingestion
     [ RIPE RIS Live WebSocket ]   [ Synthetic Scenarios ]   [ Operator Injection ]
                                      |
                                      v
                         Normalization Engine (RFC-Compliant)
               * Host-bit zeroing (ipaddress)  * ASN canonicalization (ASxxxxx)
                                      |
                                      v
                         Detection & Baseline Engine
               * Multi-peer promotion invariant (peer >= 2, count >= 3)
               * Origin-AS conflict detection without baseline poisoning
               * Subprefix LPM containment check (IPv4 / IPv6)
               * Per-peer withdrawal recovery state machine
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
         Persistence Layer                          Forensic Evidence
   * SQLite WAL Mode (horaq.db)               * RFC 8785 Canonical JSON (JCS)
   * Append-only observation history          * SHA-256 Content Digest
   * Versioned baseline audit trail           * NIST FIPS 204 ML-DSA-65 Signature
                 |                                         |
                 +--------------------+--------------------+
                                      |
                                      v
                       Web Operations Console & CLI
             * React 18 + TypeScript + Tailwind CSS (Port 5173)
             * Independent CLI Verifier: verify_evidence.py (Exit 0, 1, 2)
```

---

## 5. Installation & Run Instructions

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: v18+ (tested on Node v20.x / v22.x)
- **Git**

### Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend automated tests (93 tests)
python -m pytest backend/tests -v

# Start FastAPI server on port 8000
python -m uvicorn horaq.main:app --host 127.0.0.1 --port 8000
```
OpenAPI documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build static production bundle (type check + minify)
npm run build

# Start Vite dev server on port 5173
npm run dev
```
Operations Console: [http://localhost:5173](http://localhost:5173)

---

## 6. Reproducible Test Commands

HORA-Q maintains 100% passing tests across all test modules:

```bash
# 1. Run complete backend unit and integration test suite (93 tests):
python -m pytest backend/tests -v

# 2. Run live 6-stage evaluator lifecycle verification:
python backend/scripts/verify_live_lifecycle.py

# 3. Verify frontend TypeScript type-checking and production build:
npm --prefix frontend run build
```

**Test Suite Evolution History**:
- `81 Tests Passed`: Initial baseline audit (2026-10-26 commit `9b2a25b`).
- `92 Tests Passed`: Added multi-peer withdrawal recovery and historical replay suite (2026-10-26 commit `f58899e`).
- `93 Tests Passed`: Added observation telemetry API endpoint validation and operational credibility suite (2026-10-27).

---

## 7. Synthetic Evaluator Walkthrough

The web console features an interactive 6-stage walkthrough (collapsible on the **Overview** dashboard) guiding evaluators through the complete verification lifecycle with real backend calls:

1. **Stage 1: Establish Clean Baseline**: Seeds `192.0.2.0/24` (AS64496). Confirms zero false alarms on clean seeding and logs an `AUTHORIZED_SEED` entry in the versioned baseline history.
2. **Stage 2: Trigger Routing Anomaly**: Injects subprefix hijack `192.0.2.128/25` from rogue AS64500. Proves instant containment without baseline poisoning.
3. **Stage 3: Inspect Explanation**: Inspects deterministic root-cause reasoning, confidence scoring, and active announcing peer tracking.
4. **Stage 4: Check Live RPKI Status**: Queries live RIPEstat ROA validation API to evaluate cryptographic origin authorization (`VALID`, `INVALID`, `UNKNOWN`, `UNAVAILABLE`).
5. **Stage 5: Verify Post-Quantum Evidence**: Opens Evidence Vault modal. Demonstrates RFC 8785 canonical bytes, SHA-256 match, and NIST FIPS 204 ML-DSA-65 post-quantum signature verification.
6. **Stage 6: Ingest Route Withdrawal**: Ingests authentic BGP route withdrawal from observing peer AS64500. Confirms alert transition to `RESOLVED` with recovery notes.

---

## 8. Independent Cryptographic Evidence Verification (CLI)

HORA-Q provides a standalone verification tool (`verify_evidence.py`) allowing evaluators to verify evidence records independently of the web application:

```bash
# 1. Verify authentic ML-DSA-65 signed evidence record (Exit code 0):
python verify_evidence.py audit/sample_evidence_signed.json

# 2. Demonstrate tamper detection on signed record (Exit code 1):
python verify_evidence.py audit/sample_evidence_signed.json --tamper

# 3. Verify that an unsigned record cannot receive an authentic verdict (Exit code 2):
python verify_evidence.py audit/sample_evidence_unsigned.json

# 4. Demonstrate tamper detection on unsigned record (Exit code 1):
python verify_evidence.py audit/sample_evidence_unsigned.json --tamper
```

**Verification Exit Codes**:
- `Exit Code 0` (`[AUTHENTIC]`): RFC 8785 canonical bytes, SHA-256 digest match, and NIST FIPS 204 ML-DSA-65 signature verified mathematically.
- `Exit Code 1` (`[COMPROMISED]`): Tamper detected. Payload modification detected via hash mismatch or corrupted signature.
- `Exit Code 2` (`[UNSIGNED]`): Payload integrity confirmed via SHA-256, but record lacks an authority signature.

---

## 9. Key Links & Submission Artifacts

- **Team Introduction Video**: [YouTube Presentation](https://youtu.be/oKoHllmyCMQ)
- **Official Proposals**:
  - [HORA Q — AIORI-3 Proposal](HORA%20Q%20%E2%80%94%20Explainable%20BGP%20Anomaly%20Monitor%20%28AIORI-3%20Proposal%29.pdf)
  - [Proposed Structure Hackathon](Proposed-structure-hackathon.pdf)
- **Deployment Topology**: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- **Proposal vs. Built Verification**: [`PROPOSED_VS_BUILT_VERIFIED.md`](PROPOSED_VS_BUILT_VERIFIED.md)
- **Technical Documentation Suite**: [`docs/README.md`](docs/README.md)
  - [1. Architecture & Design](docs/ARCHITECTURE.md)
  - [2. Detection & Baselines](docs/DETECTION_AND_BASELINES.md)
  - [3. API & Data Model](docs/API_AND_DATA_MODEL.md)
  - [4. Evidence & Cryptography](docs/EVIDENCE_AND_CRYPTOGRAPHY.md)
  - [5. Testing & Evaluation](docs/TESTING_AND_EVALUATION.md)
  - [6. Evaluator Demo Guide](docs/DEMO_GUIDE.md)
  - [7. Threat Model & Boundaries](docs/THREAT_MODEL_AND_LIMITATIONS.md)
  - [8. Operations & Deployment](docs/OPERATIONS.md)

---

## 10. Repository Structure

```
A3-PS005-TC416/
├── README.md                          # Authoritative evaluator overview & quickstart
├── LICENSE                            # MIT License
├── DEPLOYMENT.md                      # Production deployment specification
├── PROPOSED_VS_BUILT_VERIFIED.md      # Proposal compliance & verification matrix
├── verify_evidence.py                 # Standalone independent evidence verification CLI
├── horaq_authority_key.json           # Authority key for ML-DSA-65 signing
├── docs/                              # Maintained technical documentation suite
│   ├── README.md                      # Documentation index
│   ├── ARCHITECTURE.md                # System pipeline & component boundaries
│   ├── DETECTION_AND_BASELINES.md     # Baseline lifecycle, detection & withdrawals
│   ├── API_AND_DATA_MODEL.md          # REST API reference (/api/v1) & SQLite schema
│   ├── EVIDENCE_AND_CRYPTOGRAPHY.md   # RFC 8785 JCS, SHA-256 & NIST FIPS 204 ML-DSA-65
│   ├── TESTING_AND_EVALUATION.md      # Pytest test suite, benchmarks & replays
│   ├── DEMO_GUIDE.md                  # 6-Stage interactive evaluator demo walkthrough
│   ├── THREAT_MODEL_AND_LIMITATIONS.md# Threat analysis & scientific scope boundaries
│   └── OPERATIONS.md                  # Operational configuration & CI pipeline
├── backend/                           # FastAPI backend service
│   ├── requirements.txt               # Python dependencies
│   ├── horaq/                         # Core Python package (detection, crypto, api, etc.)
│   ├── tests/                         # Pytest test suite (93 automated tests)
│   └── scripts/                       # Verification, replay and benchmark runner scripts
├── frontend/                          # React + TypeScript + Vite Operations Console
│   ├── package.json                   # Frontend dependencies
│   └── src/                           # Components, views, stores, and API clients
├── audit/                             # Evaluator evidence, test results & screenshots
│   ├── TEST_RESULTS.md                # Test execution logs (93 passed)
│   ├── SYSTEM_AUDIT_REPORT.md         # Comprehensive system & cryptographic audit
│   ├── IMPLEMENTATION_MATRIX.md       # Traceability matrix
│   ├── KNOWN_LIMITATIONS.md           # Technical boundaries & operational disclosures
│   ├── SECURITY_REVIEW.md             # Threat modeling & security analysis
│   ├── reference_detector_comparison.json
│   ├── historical_attack_validation.json
│   ├── sample_evidence_signed.json    # Authentic ML-DSA-65 evidence sample
│   ├── sample_evidence_unsigned.json  # Unsigned evidence sample
│   └── screenshots/                   # 10 canonical 16:9 desktop screenshots
└── tools/                             # Developer utilities
    └── capture_16_9.ps1               # Configurable 16:9 screenshot capture utility
```
