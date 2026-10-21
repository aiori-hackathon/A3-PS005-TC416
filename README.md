# HORA-Q — Explainable BGP Origin and Subprefix Anomaly Monitor

[![Team](https://img.shields.io/badge/Team-A3--PS005--TC416-indigo.svg)](file:///d:/HORA-Q)
[![Track](https://img.shields.io/badge/AIORI--3-Track%202%20Cyber%20Security%20(PS--005)-cyan.svg)](file:///d:/HORA-Q)
[![Tests](https://img.shields.io/badge/Tests-36%20Passed%20(100%25)-emerald.svg)](file:///d:/HORA-Q/backend/tests)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](file:///d:/HORA-Q)

**HORA-Q** is an Explainable BGP Origin and Subprefix Anomaly Monitoring system built for **AIORI-3, Track 2 Cyber Security, problem PS-005, team A3-PS005-TC416**.

It normalizes BGP route announcements, maintains per-prefix baselines, flags origin-AS discrepancies and strict more-specific subprefix announcements, binds findings to tamper-evident cryptographic evidence records (SHA-256 canonical hashing + post-quantum ML-DSA-65 signatures), and provides clear human-understandable explanations for network operations and security analysts.

---

## ⚡ Key Capabilities

1. **Deterministic BGP Detection Engine**:
   - **Baseline Seeding**: Initial observation seeds reference origin; does not trigger false alerts.
   - **Origin-AS Conflict Detection**: Identifies origin changes while strictly forbidding silent baseline overwrites.
   - **Subprefix / More-Specific Containment**: Evaluates strict subnet containment across address families (IPv4 and IPv6) with longest-prefix match awareness.
2. **Explainable Root Cause Reasoning**:
   - Generates transparent, human-readable explanations detailing comparison values and distinguishing between potential malicious hijacking, legitimate multi-homing/migration, DDoS scrubbing, and route leaks.
3. **Cryptographic Evidence Vault**:
   - Canonical JSON serialization (RFC 8785 compatible).
   - SHA-256 content integrity digest verification with live tamper detection demonstration.
   - **ML-DSA-65 Post-Quantum Signature** integration (FIPS 204), adhering to strict no-fallback rules (honest provider status without silent downgrade to classical cryptography).
4. **RPKI Context & RIPEstat Integration**:
   - Live query of cryptographic Route Origin Authorizations (ROAs).
   - Explicit `VALID`, `INVALID`, `UNKNOWN`, and `UNAVAILABLE` state reporting without inventing verdicts on network timeouts.
5. **Interactive Operations Center**:
   - High-contrast cyber dark dashboard with live KPI metrics, synthetic scenario launchers, manual route injection, and evidence inspection dialogs.

---

## 📂 Repository Structure

```
d:\HORA-Q/
├── README.md                          # Project documentation and quickstart
├── .gitignore                         # Git exclusion rules
├── HORAQ_Documentation/               # 43 engineering specifications & acceptance guides
│   ├── 00_START_HERE.md
│   ├── 01_PROJECT_BRIEF.md
│   ├── 02_REQUIREMENTS.md
│   ├── ...
│   └── INDEX.md
├── backend/                           # FastAPI backend service
│   ├── requirements.txt               # Python dependencies
│   ├── horaq/                         # Core Python package
│   │   ├── __init__.py
│   │   ├── config.py                  # Operational configuration
│   │   ├── normalization.py           # IPv4/IPv6 CIDR & ASN parser
│   │   ├── database.py                # SQLite persistence & WAL transactions
│   │   ├── evidence.py                # Canonical JSON & SHA-256 integrity
│   │   ├── crypto.py                  # ML-DSA-65 post-quantum provider
│   │   ├── rpki.py                    # RIPEstat origin validation client
│   │   ├── collector.py               # RIPE RIS Live WebSocket collector
│   │   ├── detection.py               # Detection pipeline & baseline manager
│   │   ├── api.py                     # REST API router (/api/v1)
│   │   └── main.py                    # Application entrypoint & CORS
│   └── tests/                         # Pytest test suite (36 automated tests)
│       ├── test_normalization.py
│       ├── test_evidence.py
│       ├── test_crypto.py
│       ├── test_detection.py
│       ├── test_rpki.py
│       └── test_api.py
├── frontend/                          # React + TypeScript + Vite Dashboard (inficy-gateway feel)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js             # High-contrast cyber dark / day theme tokens
│   ├── index.html
│   └── src/
│       ├── types.ts                   # Domain types & API schemas
│       ├── api.ts                     # Type-safe API client
│       ├── index.css                  # Global styles & CSS variable tokens
│       ├── stores/                    # Centralized reactive state
│       │   └── useHoraqStore.ts       # Zustand store with live telemetry
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.tsx         # Navbar with live health status, search & theme toggle
│       │   │   └── Sidebar.tsx        # Fixed categorised left navigation sidebar
│       │   ├── EvidenceModal.tsx      # Evidence vault, SHA-256 diff & ML-DSA inspector
│       │   └── RPKIModal.tsx          # Live RIPEstat RPKI validator dialog
│       ├── views/                     # Modular canvas views
│       │   ├── OverviewView.tsx       # KPI summary, 24h timeline & live activity
│       │   ├── AlertsView.tsx         # Anomaly alerts with visual containment breakdown
│       │   ├── RoutesView.tsx         # Baseline routes table with RPKI actions
│       │   ├── ScenariosView.tsx      # Synthetic scenario suite with execution console
│       │   ├── EvidenceVaultView.tsx  # Cryptographic records & hash integrity vault
│       │   ├── RPKIInspectorView.tsx  # Interactive RPKI origin-validation tool
│       │   ├── InjectRouteView.tsx    # Manual route announcement simulator
│       │   └── SettingsView.tsx       # System parameters, themes & database reset
│       ├── App.tsx                    # Main desktop application layout
│       └── main.tsx                   # DOM bootstrap
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: v18+ (tested on Node v22.18.0)
- **Git**

### 2. Backend Setup & Run

```bash
cd d:\HORA-Q\backend

# Activate virtual environment (created during setup)
.venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run the backend test suite (36 tests)
pytest -v

# Start the FastAPI server on port 8000
uvicorn horaq.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive OpenAPI Swagger docs will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup & Run

```bash
cd d:\HORA-Q\frontend

# Install dependencies (if not already installed)
npm install

# Build production bundle
npm run build

# Start the Vite development server
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Evaluation Scenarios

The system includes pre-configured reproducible synthetic evaluation scenarios per **Document 21**:

| Scenario | Injected Route | Origin ASN | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **1. Baseline Seeding** | `192.0.2.0/24` | `AS64496` | Baseline created. **0 alerts**. |
| **2. Origin-AS Conflict** | `192.0.2.0/24` | `AS64511` | `ORIGIN_CHANGE` alert fired (HIGH). Baseline preserved. |
| **3. Subprefix Anomaly** | `192.0.2.128/25` | `AS64500` | `SUBPREFIX_ANOMALY` alert fired (parent: `192.0.2.0/24`). |
| **4. Tagged Migration** | `198.51.100.0/24` | `AS64498` | Explainable alert generated noting migration tag context. |
| **5. IPv6 Subprefix** | `2001:db8:1::/48` | `AS64505` | `SUBPREFIX_ANOMALY` alert fired under IPv6 `/32` parent. |
| **6. Reset State** | Purge Tables | N/A | Environment reset for clean evaluation. |

---

## 🔐 Cryptography & Evidence Standards

- **Canonical JSON Serialization**: Adheres to RFC 8785 principles with recursive alphanumeric key sorting and compact delimiters.
- **SHA-256 Digest**: Computed over UTF-8 canonical bytes for content tamper-evidence.
- **Post-Quantum Signatures (ML-DSA-65)**: Native integration with FIPS 204. If the underlying environment does not have `liboqs` compiled, HORA-Q explicitly reports `PROVIDER_UNAVAILABLE` rather than dangerously and silently falling back to insecure or unapproved algorithms.

---

## 📚 Complete Documentation Suite

All 43 engineering documents, architecture guides, data flows, and acceptance checklists can be reviewed in [`HORAQ_Documentation/`](file:///d:/HORA-Q/HORAQ_Documentation):
- [`00_START_HERE.md`](file:///d:/HORA-Q/HORAQ_Documentation/00_START_HERE.md)
- [`01_PROJECT_BRIEF.md`](file:///d:/HORA-Q/HORAQ_Documentation/01_PROJECT_BRIEF.md)
- [`02_REQUIREMENTS.md`](file:///d:/HORA-Q/HORAQ_Documentation/02_REQUIREMENTS.md)
- [`03_ARCHITECTURE.md`](file:///d:/HORA-Q/HORAQ_Documentation/03_ARCHITECTURE.md)
- [`08_API_REFERENCE.md`](file:///d:/HORA-Q/HORAQ_Documentation/08_API_REFERENCE.md)
- [`09_DATABASE.md`](file:///d:/HORA-Q/HORAQ_Documentation/09_DATABASE.md)
- [`12_DETECTION_ALGORITHMS.md`](file:///d:/HORA-Q/HORAQ_Documentation/12_DETECTION_ALGORITHMS.md)
- [`18_EVIDENCE.md`](file:///d:/HORA-Q/HORAQ_Documentation/18_EVIDENCE.md)
- [`19_ML_DSA.md`](file:///d:/HORA-Q/HORAQ_Documentation/19_ML_DSA.md)
- [`20_FRONTEND.md`](file:///d:/HORA-Q/HORAQ_Documentation/20_FRONTEND.md)
- [`21_SCENARIOS.md`](file:///d:/HORA-Q/HORAQ_Documentation/21_SCENARIOS.md)
- [`34_ACCEPTANCE.md`](file:///d:/HORA-Q/HORAQ_Documentation/34_ACCEPTANCE.md)
