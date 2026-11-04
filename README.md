# HORA-Q — Explainable BGP Origin & Subprefix Anomaly Monitor

[![CI](https://github.com/aiori-hackathon/A3-PS005-TC416/actions/workflows/ci.yml/badge.svg)](https://github.com/aiori-hackathon/A3-PS005-TC416/actions/workflows/ci.yml)
[![AIORI-3](https://img.shields.io/badge/AIORI--3-Track%202%20%7C%20PS--005-2563eb)](https://github.com/aiori-hackathon/A3-PS005-TC416)
[![Team](https://img.shields.io/badge/Team-A3--PS005--TC416-334155)](https://github.com/aiori-hackathon/A3-PS005-TC416)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloudflare%20Pages-f38020)](https://horaq-frontends.pages.dev)

**An explainable BGP control-plane monitoring prototype for detecting suspicious origin changes and more-specific prefix announcements, preserving trusted route baselines, and producing independently verifiable forensic evidence.**

> **Evaluation recommendation:** Clone the repository, run the backend and frontend locally, reproduce the tests, and verify the sample evidence. The source code, documentation, and reproducible checks in this repository are the primary evaluation materials. A live cloud deployment is also accessible at https://horaq-frontends.pages.dev.

---

## 1. Project overview

The Border Gateway Protocol (BGP) allows autonomous systems (ASes) to exchange network reachability information. Incorrect or malicious route announcements can redirect traffic or make prefixes reachable through an unexpected origin.

HORA-Q focuses on two observable classes of routing anomalies:

1. **Origin-AS change:** a prefix is announced by an origin ASN that conflicts with its established baseline.
2. **More-specific subprefix announcement:** a more-specific route appears within a monitored prefix and may attract traffic through longest-prefix matching.

A monitoring system must also avoid treating every unfamiliar announcement as malicious. HORA-Q separates observations from trusted baseline promotion, records why decisions were made, tracks peer withdrawals, and exposes evidence for further review.

### Project information

| | |
|---|---|
| **Project** | HORA-Q — Explainable BGP Origin and Subprefix Anomaly Monitor |
| **Hackathon** | AIORI-3 |
| **Track** | Track 2 — Cyber Security |
| **Problem statement** | PS-005 |
| **Team ID** | `A3-PS005-TC416` |
| **Institution** | Al-Ameen College |
| **Team lead** | Sankardev VS |
| **Team member** | Adarsh A |
| **Faculty mentor** | Dr. Jyothy Joseph |

**Team introduction video:** [Watch on YouTube](https://youtu.be/oKoHllmyCMQ)

**Proposal documents:** [HORA-Q AIORI-3 Proposal](HORA%20Q%20%E2%80%94%20Explainable%20BGP%20Anomaly%20Monitor%20%28AIORI-3%20Proposal%29.pdf) · [Proposed Structure](Proposed-structure-hackathon.pdf)

---

## 2. Implemented capabilities

### Detection and baseline integrity

- Normalizes IPv4/IPv6 prefixes and ASNs before evaluation.
- Maintains route baselines and append-only baseline transition history.
- Uses corroboration thresholds for ordinary candidate promotion: at least **2 peers** and **3 observations**.
- Keeps conflicting origin announcements and suspicious more-specific routes from silently overwriting an established baseline.
- Tracks withdrawals by observing peer; an incident is not resolved until the relevant announcing peers have withdrawn.

### Explainability and investigation

- Associates alerts with their triggering observations and route context.
- Exposes baseline history and peer-level withdrawal/recovery state.
- Provides RPKI validation context as `VALID`, `INVALID`, `UNKNOWN`, or `UNAVAILABLE` rather than assuming a result when external data cannot be obtained.

### Forensic evidence

- Canonicalizes evidence using RFC 8785 JSON Canonicalization Scheme (JCS).
- Computes SHA-256 content digests.
- Supports ML-DSA-65 post-quantum signature generation and verification when the configured cryptographic provider is available.
- Includes a standalone command-line verifier so evidence can be checked outside the dashboard.
- Distinguishes signed, unsigned, and compromised evidence.

**Cryptographic boundary:** A valid signature establishes integrity and signer authenticity under the applicable public-key trust assumptions. It does **not** prove that the underlying BGP observation was true.

---

## 3. Architecture

```text
 BGP update sources
 ├── Synthetic evaluator scenarios
 ├── RIPE RIS Live (opt-in; network required)
 └── Operator / API observations
             |
             v
     Normalization layer
   Prefix + ASN + timestamp
             |
             v
  Detection and baseline engine
   ├── Origin-AS conflict checks
   ├── More-specific prefix checks
   ├── Corroborated candidate promotion
   ├── Anti-baseline-poisoning rules
   └── Per-peer withdrawal recovery
             |
       +-----+------+
       |            |
       v            v
 SQLite / WAL   Forensic evidence
 observations   RFC 8785 canonical JSON
 baseline log   SHA-256 digest
                ML-DSA-65 (provider-dependent)
       |            |
       +-----+------+
             |
             v
       FastAPI backend
          /      \
         v        v
    React web   Independent CLI
    console     evidence verifier
```

**Core technologies:** Python, FastAPI, SQLite (WAL), React, TypeScript, Vite, and a Python-based cryptographic evidence/verifier workflow.

---

## 4. Run locally

Local execution is the recommended evaluation path. The default evaluator workflow uses controlled synthetic data. Live BGP ingestion is opt-in and requires an external network connection.

### Prerequisites

- Git
- Python 3.10 or later
- Node.js 18 or later and npm

### 4.1 Clone the repository

```bash
git clone https://github.com/aiori-hackathon/A3-PS005-TC416.git
cd A3-PS005-TC416
```

### 4.2 Start the backend

From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source .venv/bin/activate
```

Install dependencies and start the API:

```bash
pip install -r requirements.txt
python -m uvicorn horaq.main:app --host 127.0.0.1 --port 8000
```

- Backend: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Interactive API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 4.3 Start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL printed in the terminal (normally [http://localhost:5173](http://localhost:5173)). Keep the backend running while using the frontend.

---

## 5. Reproduce the verification

Run these commands from the repository root unless stated otherwise.

### Backend test suite

```bash
python -m venv .venv
# Activate the environment, then:
pip install -r backend/requirements.txt
python -m pytest backend/tests -v
```

### Evaluator lifecycle check

```bash
python backend/scripts/verify_live_lifecycle.py
```

### Frontend type-check and production build

```bash
cd frontend
npm install
npm run build
```

The CI badge at the top links to the repository's workflow history. Test counts can change as the test suite evolves; use the actual test output and CI result rather than relying on a static count in this README.

---

## 6. Six-stage synthetic evaluator walkthrough

The application includes a guided evaluator workflow that exercises the backend:

1. **Establish a clean baseline** — seed the controlled prefix `192.0.2.0/24` with origin `AS64496` and inspect the authorized seed entry in baseline history.
2. **Trigger a subprefix anomaly** — submit `192.0.2.128/25` from `AS64500` and inspect the resulting detection.
3. **Inspect the explanation** — review alert context, baseline state, and peer information.
4. **Inspect RPKI context** — request ROA validation context. The result depends on RIPEstat availability and may be `UNKNOWN` or `UNAVAILABLE`.
5. **Verify forensic evidence** — inspect the canonical evidence payload, digest, and signature status.
6. **Confirm withdrawal recovery** — submit the relevant peer withdrawal and inspect whether the incident can transition to `RESOLVED`.

For the detailed walkthrough, see [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md).

---

## 7. Independently verify sample evidence

The repository includes sample evidence records and a standalone verifier. Run these commands from the repository root:

```bash
# Expected: authentic signed evidence (exit code 0)
python verify_evidence.py audit/sample_evidence_signed.json

# Expected: tampering is detected (exit code 1)
python verify_evidence.py audit/sample_evidence_signed.json --tamper

# Expected: unsigned record is not accepted as authentic (exit code 2)
python verify_evidence.py audit/sample_evidence_unsigned.json

# Expected: tampering is detected (exit code 1)
python verify_evidence.py audit/sample_evidence_unsigned.json --tamper
```

| Exit code | Meaning |
|---:|---|
| `0` | Evidence digest and configured signature verification succeeded. |
| `1` | Evidence was modified, corrupted, or signature verification failed. |
| `2` | The record is unsigned and cannot establish signer authenticity. |

**Key management:** Do not commit or distribute private signing keys. Signature verification depends on the configured ML-DSA-65 provider and the public key included in or trusted for the evidence record. If the provider is unavailable, the system should report that state rather than claim a signature was generated.

---

## 8. Operating modes and external dependencies

| Mode / component | Purpose | Important condition |
|---|---|---|
| **Synthetic** | Controlled evaluator scenarios using documentation/test address ranges. | Recommended for repeatable local evaluation. |
| **Live RIS** | Optional ingestion from RIPE NCC RIS Live. | Requires outbound network access; disabled by default. |
| **Historical replay** | Replay of archival MRT data where supported by the replay workflow and available datasets. | Results depend on the supplied archive and replay configuration. |
| **RPKI context** | Retrieves ROA validation context through RIPEstat. | External service latency, rate limits, and availability can affect results. |

---

## 9. Scope and known limitations

HORA-Q is a focused BGP **control-plane** monitoring prototype. It should not be interpreted as a complete production-grade Internet routing security platform.

- **Detection scope:** Primary detection targets origin-AS conflicts and more-specific subprefix announcements. It does not claim comprehensive detection of every route leak or routing-policy violation.
- **Data-plane visibility:** It does not perform packet-forwarding analysis or traceroute-based reachability measurement.
- **Subprefix interpretation:** A more-specific announcement can be legitimate traffic engineering as well as suspicious activity. An anomaly alone is not proof of malicious intent.
- **Baseline changes:** Legitimate prefix transfers and origin changes require an authorized operator decision; the system does not automatically trust a new origin merely because it appears.
- **Live collection:** Live ingestion depends on the external RIS stream and network availability. Gaps during disconnection are not guaranteed to be backfilled automatically.
- **RPKI:** RIPEstat is an external dependency. When validation cannot be obtained, the system reports an unknown/unavailable state rather than assuming validity.
- **Cryptographic provider:** ML-DSA-65 signing depends on the runtime's supported provider configuration. Provider unavailability must be reported rather than silently downgraded or represented as a successful signature.
- **Storage and scale:** The current SQLite WAL design is a single-node prototype, not a distributed carrier-scale telemetry platform.

See [audit/KNOWN_LIMITATIONS.md](audit/KNOWN_LIMITATIONS.md) and [docs/THREAT_MODEL_AND_LIMITATIONS.md](docs/THREAT_MODEL_AND_LIMITATIONS.md) for the expanded constraints and threat boundaries.

---

## 10. Documentation and evaluation materials

| Resource | Contents |
|---|---|
| [Project proposal](HORA%20Q%20%E2%80%94%20Explainable%20BGP%20Anomaly%20Monitor%20%28AIORI-3%20Proposal%29.pdf) | Original project proposal |
| [Proposed structure](Proposed-structure-hackathon.pdf) | Supporting proposal document |
| [Proposal-to-implementation traceability](PROPOSED_VS_BUILT_VERIFIED.md) | Proposal dimensions, implementation status, and verification notes |
| [Documentation index](docs/README.md) | Index of technical documentation |
| [Architecture](docs/ARCHITECTURE.md) | Components and data flow |
| [Detection and baselines](docs/DETECTION_AND_BASELINES.md) | Detection rules and baseline lifecycle |
| [API and data model](docs/API_AND_DATA_MODEL.md) | API surface and persistence model |
| [Evidence and cryptography](docs/EVIDENCE_AND_CRYPTOGRAPHY.md) | Canonical evidence, digest, and signature design |
| [Testing and evaluation](docs/TESTING_AND_EVALUATION.md) | Test strategy and evaluation procedures |
| [Evaluator demo guide](docs/DEMO_GUIDE.md) | Guided application walkthrough |
| [Threat model and limitations](docs/THREAT_MODEL_AND_LIMITATIONS.md) | Security assumptions and boundaries |
| [Operations](docs/OPERATIONS.md) | Runtime and operational notes |
| [Recorded test results](audit/TEST_RESULTS.md) | Test output and verification evidence |
| [System audit](audit/SYSTEM_AUDIT_REPORT.md) | Audit findings |
| [Implementation matrix](audit/IMPLEMENTATION_MATRIX.md) | Feature-to-evidence traceability |
| [Security review](audit/SECURITY_REVIEW.md) | Security review notes |
| [Known limitations](audit/KNOWN_LIMITATIONS.md) | Detailed constraints and dependencies |

---

## 11. Repository layout

```text
A3-PS005-TC416/
├── README.md
├── LICENSE
├── DEPLOYMENT.md
├── PROPOSED_VS_BUILT_VERIFIED.md
├── verify_evidence.py
├── backend/
│   ├── horaq/
│   ├── tests/
│   ├── scripts/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DETECTION_AND_BASELINES.md
│   ├── API_AND_DATA_MODEL.md
│   ├── EVIDENCE_AND_CRYPTOGRAPHY.md
│   ├── TESTING_AND_EVALUATION.md
│   ├── DEMO_GUIDE.md
│   ├── THREAT_MODEL_AND_LIMITATIONS.md
│   └── OPERATIONS.md
└── audit/
    ├── TEST_RESULTS.md
    ├── SYSTEM_AUDIT_REPORT.md
    ├── IMPLEMENTATION_MATRIX.md
    ├── SECURITY_REVIEW.md
    ├── KNOWN_LIMITATIONS.md
    └── screenshots/
```

---

## 12. Team

**HORA-Q — Team A3-PS005-TC416**  
AIORI-3 · Track 2 Cyber Security · PS-005  
Al-Ameen College

Team introduction: [https://youtu.be/oKoHllmyCMQ](https://youtu.be/oKoHllmyCMQ)

<p align="center">
  <strong>HORA-Q</strong><br/>
  Explainable routing anomaly detection with verifiable forensic evidence.
</p>
