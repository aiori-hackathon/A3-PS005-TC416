# HORA-Q — Known Limitations & Technical Constraints

> **AIORI-3 Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)**  
> **Repository**: `https://github.com/aiori-hackathon/A3-PS005-TC416`  
> **Status**: Verified & Transparently Disclosed  

---

## 1. Executive Summary

In adherence to non-negotiable hackathon integrity standards, HORA-Q maintains strict separation between **verified capabilities** and **known architectural constraints**. This document transparently enumerates the technical limits, operational boundaries, and external dependencies of the current release, preventing any exaggeration of system performance or coverage.

---

## 2. Ingestion & Carrier Feed Scaling

### 2.1 Live WebSocket Carrier Ingestion
- **Constraint**: The live collector in `horaq/collectors/ris_live.py` connects to RIPE NCC RIS Live (`wss://ris-live.ripe.net/v1/stream/`). In production default-free zone (DFZ) operation, RIS Live can burst past **15,000 to 50,000 BGP updates per second** during global route flapping or table reloads.
- **Current Bound**: The single-process Python `asyncio` loop running on SQLite can comfortably ingest, normalize, and evaluate **1,200 to 2,000 updates/second**. Sustained global flood loads require sharded queue workers (e.g., Celery/Redis or Apache Kafka).
- **Network Dependency**: Live streaming requires active outbound internet access to RIPE servers. If the link degrades or RIPE drops the socket, an exponential backoff reconnects automatically, but updates occurring during the disconnection gap are not guaranteed to backfill unless a historical MRT catchup parser is run.

### 2.2 Collector-Perspective Skew
- **Constraint**: Different RIS Remote Route Collectors (RRC00 Amsterdam, RRC12 Frankfurt, RRC24 Montevideo, etc.) observe routing announcements at varying timestamps due to BGP convergence latency (MRAI timers).
- **Current Bound**: HORA-Q attributes each observation to its specific `collector` and records the upstream `peer_ip` / `as_path`. However, the current baseline model operates globally per `(prefix, origin_as)` rather than maintaining isolated per-collector topology graphs.

---

## 3. Storage & Concurrency Architecture

### 3.1 SQLite WAL Mode Concurrency
- **Constraint**: HORA-Q persists state in SQLite (`horaq.db`) with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`).
- **Current Bound**: WAL mode allows concurrent readers (`SELECT`) alongside a single writer (`INSERT/UPDATE`). Under extreme multi-threaded or multi-process write contention, SQLite may return `sqlite3.OperationalError: database is locked` if write transactions exceed the configured `busy_timeout` (5000ms).
- **Recommended Scale-Out**: For multi-node deployments monitoring millions of global prefixes, transition to **PostgreSQL 16** with TimescaleDB or Citus partitioning for raw BGP telemetry tables.

---

## 4. RPKI Validation & External Context

### 4.1 External Service Latency & Rate Limits
- **Constraint**: The RPKI module in `horaq/rpki.py` queries the RIPEstat Data API (`https://stat.ripe.net/data/rpki-validation/data.json`).
- **Current Bound**: RIPEstat enforces rate-limiting and exhibits network latency (200ms–1500ms per query). While HORA-Q caches validation results in an in-memory TTL dictionary, a cold cache query for an unobserved prefix introduces an async network round-trip.
- **Fail-Safe Mechanism**: When network timeouts occur or RIPEstat returns HTTP 429/500, HORA-Q marks RPKI context as `"UNKNOWN"` or `"UNAVAILABLE"` with `cached: false`. It explicitly **does not assume** `"VALID"` or `"INVALID"`.
- **Recommended Scale-Out**: Enterprise deployments should run a local RPKI Relying Party validator (e.g., Routinator 3000, OctoRPKI) and query via RTR (RPKI-to-Router) protocol over localhost.

---

## 5. Cryptography & Post-Quantum Signatures

### 5.1 ML-DSA-65 (FIPS 204) Native Dependencies
- **Constraint**: Generating quantum-resistant Module-Lattice-Based Digital Signatures (ML-DSA-65) requires hardware-optimized C-extensions via `liboqs` or `liboqs-python`.
- **Current Bound**: On operating environments where native pre-compiled C shared libraries (`liboqs.dll` or `liboqs.so`) are not installed on the system PATH, the Python runtime cannot bind to the hardware assembly primitives.
- **Transparent Fallback**: `horaq/crypto.py` refuses to fake signatures or silently downgrade to classical ECDSA/RSA. It produces canonical RFC 8785 JSON hashes (SHA-256) and returns:
  ```json
  {
    "algorithm": "ML-DSA-65",
    "status": "PROVIDER_UNAVAILABLE",
    "signer_status": "UNSIGNED",
    "reason": "liboqs native C-library not present on system PATH"
  }
  ```
- **Integrity Guarantee**: The cryptographic evidence record's deterministic hash (`canonical_hash_sha256`) remains 100% active and testable across all platforms, providing immutable tamper detection.

---

## 6. Baseline Learning & Anomaly Semantics

### 6.1 Non-Poisoning vs. Operational Route Transfers
- **Constraint**: HORA-Q enforces a strict **non-poisoning baseline policy**. When an origin changes (e.g., from `AS13335` to `AS64505`), the anomaly is flagged as `HIGH` severity and the baseline table is **not** overwritten.
- **Operational Reality**: In legitimate network engineering, IP address blocks are occasionally sold, transferred, or reassigned to a new upstream provider (e.g., via ARIN/RIPE transfers).
- **Current Bound**: HORA-Q requires an authorized human operator or administrative API call to update the baseline after verifying an out-of-band Letter of Authorization (LOA) or updated ROA. There is no automated heuristic that promotes a foreign origin into the baseline without validation.

### 6.2 More-Specific Subprefix Classification
- **Constraint**: A subprefix announcement (e.g., `192.0.2.0/25` announced when `192.0.2.0/24` is baseline) may be:
  1. A legitimate traffic-engineering deaggregation (e.g., CDN balancing across multiple points of presence).
  2. A malicious subprefix hijack designed to win the BGP Longest Prefix Match (LPM) rule.
- **Current Bound**: HORA-Q flags the event as an anomaly, evaluates covering prefix containment and RPKI ROA `max_length`, and provides complete topological context. It **does not label it malicious** unless RPKI ROA state is explicitly `INVALID_MORE_SPECIFIC` or evidence correlates with suspicious path manipulation.

---

## 7. Frontend & Dashboard Bounds

### 7.1 Large Ledger Virtualization
- **Constraint**: In the current React dashboard, the **Evidence Vault** and **Live Activity** tables display up to 200 items in real-time.
- **Current Bound**: Rendering >5,000 unpaginated DOM rows simultaneously can cause UI frame drops on low-end machines. Full production virtualization (e.g., `@tanstack/react-virtual`) should be enabled for historical query views exceeding 10,000 rows.

### 7.2 Browser Compatibility
- **Tested & Verified**: Chromium-based browsers (Google Chrome 120+, Edge 120+), Firefox 120+.
- **Legacy Fallback**: Browsers lacking CSS custom properties or modern ES2022 syntax (e.g., Internet Explorer 11) are explicitly unsupported.

---

## 8. Summary of Architectural Mitigations

| Area | Limitation | Applied Mitigation |
|---|---|---|
| **Ingestion** | Live DFZ high-burst updates | Offline deterministic Replay Engine (`POST /api/v1/replay/start`) |
| **Database** | SQLite single-writer lock | WAL mode + indexed schema + async batch transactions |
| **RPKI** | External REST latency & timeouts | In-memory TTL caching + graceful `"UNAVAILABLE"` state handling |
| **Cryptography**| Native `liboqs` platform dependency | RFC 8785 deterministic hashing + transparent `PROVIDER_UNAVAILABLE` reporting |
| **Baselines** | Cold-start / legitimate transfers | Non-poisoning baseline policy + manual operator promotion API |
| **Classifications**| LPM traffic engineering ambiguity | Explainable multi-factor evidence correlation without blind alerts |
