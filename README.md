# HORA-Q — Explainable BGP Origin and Subprefix Anomaly Monitor

[![CI](https://github.com/aiori-hackathon/A3-PS005-TC416/actions/workflows/ci.yml/badge.svg)](https://github.com/aiori-hackathon/A3-PS005-TC416/actions/workflows/ci.yml)
[![Team](https://img.shields.io/badge/Team-A3--PS005--TC416-indigo.svg)](https://github.com/aiori-hackathon/A3-PS005-TC416)
[![Track](https://img.shields.io/badge/AIORI--3-Track%202%20Cyber%20Security%20(PS--005)-cyan.svg)](https://github.com/aiori-hackathon/A3-PS005-TC416)
[![Tests](https://img.shields.io/badge/Tests-92%20Passed%20(100%25)-emerald.svg)](backend/tests)
[![License](https://img.shields.io/badge/License-Evaluation%20(Pending%20Team%20Confirmation)-lightgrey.svg)](#license)
[![Deployment](https://img.shields.io/badge/Deployment-Standby%20Guide-blueviolet.svg)](DEPLOYMENT.md)

**AIORI-3 Hackathon · Problem PS-005 · Track 2 Cyber Security**  
**Team Code:** `A3-PS005-TC416` | **Institution:** Al-Ameen College  
**Team Members:** Sankardev VS (Team Lead), Adarsh A (Team Member) | **Faculty Mentor:** Dr. Jyothy Joseph  
**Team Introduction Video:** [https://youtu.be/oKoHllmyCMQ](https://youtu.be/oKoHllmyCMQ)  
**Project Proposal:** [HORA Q — Explainable BGP Anomaly Monitor (AIORI-3 Proposal).pdf](HORA%20Q%20%E2%80%94%20Explainable%20BGP%20Anomaly%20Monitor%20(AIORI-3%20Proposal).pdf) | [Proposed-structure-hackathon.pdf](Proposed-structure-hackathon.pdf)

---

**HORA-Q** is an explainable BGP origin and subprefix anomaly monitoring architecture engineered for AIORI-3. It normalizes BGP route announcements, maintains multi-peer corroborated baselines with append-only version history, detects origin-AS conflicts and strict more-specific subprefix announcements without baseline poisoning, tracks per-peer withdrawal recovery, binds forensic findings into tamper-evident canonical evidence records (RFC 8785 JSON + SHA-256), and provides **NIST FIPS 204 ML-DSA-65 post-quantum digital signatures** with independent command-line verification.

### Empirical Verification Status:
- **Unit & Integration Tests**: 92 of 92 backend tests passing (100% pass rate in CI).
- **Post-Quantum Digital Signatures**: Standardized NIST FIPS 204 ML-DSA-65 implemented via `dilithium-py.ml_dsa.ML_DSA_65` and `liboqs`, backed by persistent authority key management.
- **Evidence Canonicalization**: Deterministic RFC 8785 JSON Canonicalization Scheme (JCS) backed by the standard `rfc8785` package.
- **Independent Verification**: Standalone CLI verifier (`verify_evidence.py`) confirms authentic signatures (exit 0), detects tamper (exit 1), and rejects unsigned records as non-authentic (exit 2).
- **Interactive Evaluator Walkthrough**: 6-stage guided evaluator walkthrough embedded directly in the web operations console (`OverviewView.tsx`).
- **Production Deployment Guide**: Complete topology specification for Cloudflare Pages (Frontend) and Railway (Backend + Volume Mount) in [`DEPLOYMENT.md`](DEPLOYMENT.md). Deployment URLs are documented as placeholders pending team hosting.
- **Live Ingestion & Resolvers**: Opt-in RIPE RIS Live WebSocket collector and RIPEstat RPKI origin validation resolver.

---

## ⚡ Technical Capabilities

1. **Deterministic BGP Anomaly Detection Engine**:
   - **Baseline Seeding**: Initial observation seeds reference origin without false positives.
   - **Candidate Quarantine**: Single-peer flapping routes enter as `CANDIDATE`; promotion to `PROMOTED` requires multi-source peer corroboration (`peer_count >= 2` AND `observation_count >= 3`).
   - **Origin-AS Conflict Detection**: Flags unauthorized origin announcements while strictly preventing baseline poisoning.
   - **Subprefix Containment Detection**: Flags more-specific announcements (/25 under /24, /48 under /32) across IPv4 and IPv6 address families.
   - **Per-Peer Withdrawal Recovery**: Ingests BGP `WITHDRAWAL` messages; tracks recovery per observing peer; resolves incidents only when all active announcing peers have withdrawn.

2. **Explainable Root Cause Reasoning**:
   - Generates transparent, human-readable forensic explanations distinguishing unauthorized route hijacking, dual-origin provider migration, DDoS scrubbing, and multi-homing.

3. **Post-Quantum Cryptography & Tamper-Evident Evidence**:
   - **RFC 8785 Canonical JSON**: Deterministic UTF-16 code unit key sorting and compact encoding.
   - **SHA-256 Digest**: Immutable content integrity binding.
   - **FIPS 204 ML-DSA-65 Post-Quantum Signatures**: Real cryptographic key generation, signing, and verification via `dilithium-py` / `liboqs` with strict refusal of classical substitution.
   - **Independent CLI Verifier** (`verify_evidence.py`): External verification outside the browser that validates hashes, verifies post-quantum signatures, and reliably catches tampered records.

4. **RPKI Context & RIPEstat Integration**:
   - Evaluates cryptographic Route Origin Authorizations (ROAs) with transparent `VALID`, `INVALID`, `UNKNOWN`, and `UNAVAILABLE` statuses.

5. **Operator-Grade Web Operations Console**:
   - Clean daylight palette with high-contrast dark mode toggle (`#F8F9FA` canvas, `#FFFFFF` surfaces, `#1A73E8` brand blue).
   - Full 1360px desktop workspace scale with structured tabular ledgers instead of nested cards for rapid forensic triage.

---

## 📂 Repository Structure

```
A3-PS005-TC416/
├── README.md                          # Project documentation and quickstart
├── DEPLOYMENT.md                      # Production deployment guide & topology
├── PROPOSED_VS_BUILT_VERIFIED.md      # Proposal compliance & verification matrix
├── verify_evidence.py                 # Standalone independent evidence verification CLI
├── docs/                              # Consolidated technical engineering documentation
│   ├── README.md                      # Documentation index
│   ├── ARCHITECTURE.md                # System pipeline & component boundaries
│   ├── DETECTION_AND_BASELINES.md     # Baseline lifecycle, detection algorithms & withdrawals
│   ├── API_AND_DATA_MODEL.md          # REST API reference (/api/v1) & database schema
│   ├── EVIDENCE_AND_CRYPTOGRAPHY.md   # RFC 8785 JCS, SHA-256 & NIST FIPS 204 ML-DSA-65
│   ├── TESTING_AND_EVALUATION.md      # Pytest test suite, benchmarks & historical replays
│   ├── DEMO_GUIDE.md                  # 6-Stage interactive evaluator demo walkthrough
│   ├── THREAT_MODEL_AND_LIMITATIONS.md# Threat analysis & scientific scope boundaries
│   └── OPERATIONS.md                  # Operational configuration & CI pipeline
├── backend/                           # FastAPI backend service
│   ├── requirements.txt               # Python dependencies
│   ├── horaq/                         # Core Python package (detection, crypto, api, etc.)
│   ├── tests/                         # Pytest test suite (92 automated tests)
│   └── scripts/                       # Replay and benchmark runner scripts
├── frontend/                          # React + TypeScript + Vite Operations Console
│   ├── package.json                   # Frontend dependencies
│   └── src/                           # Components, views, stores, and API clients
├── audit/                             # Evaluation evidence, benchmark data & screenshots
│   ├── reference_detector_comparison.json
│   ├── historical_attack_validation.json
│   ├── UI_SCREENSHOTS_AUDIT.md        # Screenshot inventory & page descriptions
│   └── screenshots/                   # 10 canonical 16:9 desktop screenshots
└── scripts/maintenance/               # Maintenance scripts (capture_16_9.ps1)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: v18+ (tested on Node v20.x / v22.x)
- **Git**

### 2. Backend Setup & Run

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the automated test suite (92 tests)
pytest -v

# Start the FastAPI server on port 8000
uvicorn horaq.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive OpenAPI Swagger docs will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup & Run

```bash
cd frontend

# Install dependencies
npm install

# Build production bundle (verifies TypeScript types)
npm run build

# Start the Vite development server
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 6-Stage Evaluator Guided Walkthrough

The operations console includes an interactive stepper at the top of the **Overview** dashboard that guides evaluators through the complete verification lifecycle with one click per step:

1. **Stage 1: Establish Clean Baseline**: Seeds `192.0.2.0/24` (AS64496). Proves zero false alarms on clean seeding and logs an `AUTHORIZED_SEED` entry in the versioned history ledger.
2. **Stage 2: Trigger Routing Anomaly**: Injects subprefix hijack `192.0.2.128/25` from rogue AS64500. Proves instant subprefix containment without baseline poisoning.
3. **Stage 3: Inspect Explanation**: Inspects plain-English root-cause rationale, confidence scoring, and active observing peer tracking.
4. **Stage 4: Check Live RPKI Status**: Queries live RIPEstat ROA validation API to evaluate cryptographic origin authorization.
5. **Stage 5: Verify Post-Quantum Evidence**: Opens Evidence Vault modal. Demonstrates RFC 8785 canonical byte inspection, SHA-256 hash match, and NIST FIPS 204 ML-DSA-65 post-quantum signature verification.
6. **Stage 6: Ingest Route Withdrawal**: Ingests authentic BGP route withdrawal from observing peer AS64500. Confirms alert transition to `RESOLVED` with confirmed recovery notes.

---

## 🔐 Independent Evidence Verification (CLI)

HORA-Q provides a standalone command-line verifier (`verify_evidence.py`) enabling external evaluators to cryptographically inspect and verify evidence records outside the browser:

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

**Verification Guarantees & Exit Codes**:
- `Exit Code 0` (`[AUTHENTIC]`): RFC 8785 canonical bytes, SHA-256 digest match, and NIST FIPS 204 ML-DSA-65 digital signature verified mathematically.
- `Exit Code 1` (`[COMPROMISED]`): Tamper detected. Payload modification detected via hash mismatch or corrupted signature.
- `Exit Code 2` (`[UNSIGNED]`): Payload integrity confirmed via SHA-256, but unsigned; authenticity and signer identity cannot be established without an authority signature.

---

## 📚 Technical Documentation Suite

The complete engineering documentation is consolidated in [`docs/`](docs/):
- **[System Architecture](docs/ARCHITECTURE.md)**
- **[Detection Algorithms & Baseline Lifecycle](docs/DETECTION_AND_BASELINES.md)**
- **[API Reference & Data Models](docs/API_AND_DATA_MODEL.md)**
- **[Evidence Integrity & Cryptography](docs/EVIDENCE_AND_CRYPTOGRAPHY.md)**
- **[Testing, Benchmarks & Evaluation](docs/TESTING_AND_EVALUATION.md)**
- **[Evaluator Demonstration Guide](docs/DEMO_GUIDE.md)**
- **[Threat Model & Scientific Boundaries](docs/THREAT_MODEL_AND_LIMITATIONS.md)**
- **[Operations & Deployment](docs/OPERATIONS.md)**

---

## 📄 License

**License Pending Team Confirmation**: This codebase and documentation are submitted for official evaluation in the **AIORI-3 Hackathon (Track 2 Cyber Security, Problem PS-005)** by Team `A3-PS005-TC416`. Open-source licensing will be finalized upon team confirmation.
