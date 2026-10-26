# HORA-Q — Architecture & System Design

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. System Pipeline & Core Philosophy

HORA-Q operates as a continuous BGP route observation, anomaly detection, and cryptographic notarization pipeline. The architecture is structured around seven deterministic processing stages:

```
┌─────────────┐     ┌───────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│ 1. DISCOVER │ ──> │ 2. NORMALIZE  │ ──> │ 3. BASELINE EVALUATE │ ──> │ 4. DETECT & FLAG │
└─────────────┘     └───────────────┘     └──────────────────────┘     └──────────────────┘
                                                                                 │
┌─────────────┐     ┌───────────────┐     ┌──────────────────────┐               │
│ 7. VERIFY   │ <── │ 6. NOTARIZE   │ <── │ 5. CORRELATE/EXPLAIN │ <─────────────┘
└─────────────┘     └───────────────┘     └──────────────────────┘
```

1. **DISCOVER**: Route updates arrive via REST API (`/api/v1/observations`), archival MRT BGP table dumps (`backend/horaq/replay.py`), or the opt-in live RIPE RIS WebSocket collector (`backend/horaq/collector.py`).
2. **NORMALIZE**: IPv4/IPv6 CIDRs are stripped of non-zero host bits (`198.51.100.5/24` $\to$ `198.51.100.0/24`); ASNs are validated into canonical integer/string forms (`AS0`, negative numbers, and out-of-range 32-bit values are rejected); timestamps normalize to ISO 8601 UTC.
3. **BASELINE EVALUATE**: Unpromoted routes enter as `CANDIDATE`. A route is promoted to `PROMOTED` only when corroborated by multiple distinct observing peers (`peer_count >= 2` AND `observation_count >= 3`), or when explicitly initialized through the authenticated administrative endpoint (`/api/v1/baselines/seed`).
4. **DETECT & FLAG**: The engine evaluates incoming routes against established baselines for:
   - **Origin-AS Conflict**: An authorized prefix announced by a conflicting origin ASN.
   - **Subprefix Containment**: A more-specific subnet (e.g. `/25` inside `/24`, `/48` inside `/32`) announced by an unexpected origin, exploiting BGP Longest Prefix Match (LPM).
   - Invariant: Anomalous routes are quarantined and **never** poison reference baselines.
5. **CORRELATE & EXPLAIN**: Root causes are classified into operator-understandable explanations (e.g., distinguishing unauthorized hijackings from dual-origin provider migrations, DDoS scrubbing, or intra-AS multi-homing) alongside confidence scoring and active observing peer tracking.
6. **NOTARIZE**: Incidents generate an immutable forensic record canonicalized according to **RFC 8785 JSON Canonicalization Scheme (JCS)**, hashed with **SHA-256**, and digitally signed using **NIST FIPS 204 ML-DSA-65** post-quantum lattice cryptography.
7. **VERIFY**: Standalone CLI (`verify_evidence.py`) and browser verification tools mathematically validate evidence integrity and signature authenticity outside the runtime environment.

---

## 2. Component Boundaries & Directory Layout

```
A3-PS005-TC416/
├── backend/                           # Python 3.10+ / FastAPI Backend Service
│   ├── horaq/                         # Core Python package
│   │   ├── config.py                  # Pydantic Settings & environment variables
│   │   ├── normalization.py           # IPv4/IPv6 prefix & ASN parsing rules
│   │   ├── database.py                # SQLite persistence, WAL transactions, migrations
│   │   ├── evidence.py                # RFC 8785 canonical JSON & SHA-256 hashing
│   │   ├── crypto.py                  # NIST FIPS 204 ML-DSA-65 provider & authority key
│   │   ├── rpki.py                    # RIPEstat REST client for ROA origin validation
│   │   ├── collector.py               # RIPE RIS Live WebSocket telemetry collector
│   │   ├── detection.py               # Detection engine, baseline quarantine & withdrawals
│   │   ├── api.py                     # FastAPI HTTP API router (/api/v1)
│   │   ├── benchmark.py               # 14-case head-to-head reference detector benchmark
│   │   ├── replay.py                  # Archival MRT historical incident replay engine
│   │   └── main.py                    # Application entrypoint, lifespan & CORS
│   ├── tests/                         # Pytest automated test suite (92 tests)
│   ├── scripts/                       # Replay and benchmark runner scripts
│   └── requirements.txt               # Pinned Python package dependencies
├── frontend/                          # React 18 + TypeScript + Vite Operations Console
│   ├── src/
│   │   ├── components/                # Modular UI components (EvidenceModal, RPKIModal, EvaluatorGuideCard)
│   │   ├── views/                     # Canvas views (Overview, Alerts, Routes, Scenarios, Evidence, RPKI)
│   │   ├── stores/                    # Zustand centralized reactive state
│   │   ├── types.ts                   # Domain schemas and API interfaces
│   │   └── api.ts                     # Type-safe HTTP client
│   └── package.json                   # Node.js dependencies & build scripts
├── docs/                              # Technical engineering documentation suite
├── audit/                             # Audit reports, evaluation JSON, and 16:9 UI screenshots
├── scripts/maintenance/               # Operational helper scripts (screenshot capture)
└── verify_evidence.py                 # Standalone independent evidence verification CLI
```

---

## 3. Technology Choices & Design Rationale

| Layer | Technology | Engineering Rationale |
| :--- | :--- | :--- |
| **Backend Runtime** | Python 3.10+ & FastAPI | Asynchronous I/O for telemetry streaming; Pydantic for strict typed schema validation; native `ipaddress` module for robust CIDR containment checks. |
| **Persistence** | SQLite with WAL Mode | Zero-configuration local database with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) ensuring concurrent reads during telemetry writes without lock contention. |
| **Canonicalization** | RFC 8785 (JCS) | RFC-standardized byte ordering (UTF-16 code unit key sorting, compact delimiters) preventing whitespace-induced hash mismatches across heterogeneous clients. |
| **Cryptographic Signer** | NIST FIPS 204 ML-DSA-65 | Lattice-based post-quantum digital signature algorithm (Security Category 3); resistant to Shor's algorithm on quantum computers; backed by `dilithium-py` and `liboqs`. |
| **Frontend UI** | React 18, TypeScript, Tailwind | Desktop-optimized 1360px tabular interface; daylight-first palette with cyber dark mode; zero nested card clutter for rapid SOC-style incident triage. |
| **RPKI Validation** | RIPEstat Data API | Live cryptographic Route Origin Authorization (ROA) cross-checking independent of BGP peer announcements. |
