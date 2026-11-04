# HORA-Q — Operations, Deployment & Runbook

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  
**Standard**: Google SOC Enterprise Production Operational Runbook  

---

## 1. Operational Architecture & Deployment Topology

HORA-Q operates as a decoupled, enterprise telemetry pipeline consisting of an asynchronous FastAPI backend service, an SQLite WAL operational datastore, and a client-side React 19 / TypeScript Single Page Application (SPA).

```
  +---------------------------------------------------------------------------------+
  |                               Enterprise Network / Host                         |
  +---------------------------------------------------------------------------------+
            |                                                      |
            | HTTP / REST (Port 8000)                              | HTTP (Port 5173)
            v                                                      v
  +-------------------------------------+                +--------------------------+
  |        Backend Service              |                |     Frontend Web Console |
  |      (FastAPI / Python 3.13)        |                |  (React 19 / TypeScript) |
  |                                     |                |                          |
  |  +-------------------------------+  |   JSON / CORS  |                          |
  |  |  FastAPI (Uvicorn Listener)   |<-+----------------| In-Browser FIPS 204      |
  |  +-------------------------------+  |                | Evidence Verification    |
  |  |  Post-Quantum ML-DSA-65 Signer|  |                | & Telemetry Dashboard    |
  |  +-------------------------------+  |                +--------------------------+
  |  |  SQLite 3 (WAL Mode + Pragma) |  |                             ^
  |  +-------------------------------+  |                             |
  |                 ^                   |                             |
  +-----------------|-------------------+                             |
                    |                                                 |
         WebSocket  |                                                 |
                    v                                                 |
  +-------------------------------------+                             |
  |      RIPE RIS Live Telemetry        |                             |
  |  wss://ris-live.ripe.net/v1/stream  |-----------------------------+
  |      (rrc00, rrc01, rrc03)          |
  +-------------------------------------+
```

---

## 2. Environment Variables & Runtime Configuration

Backend configuration is managed strictly through Pydantic Settings (`backend/horaq/config.py`). All configuration parameters can be passed via environment variables or a local `.env` file:

| Environment Variable | Default Value | Production Recommended | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `8000` | `8000` | HTTP port for FastAPI Uvicorn listener. |
| `HORAQ_DATABASE` | `horaq.db` | `/data/horaq.db` | Path to persistent SQLite database file. Mount on a persistent volume in containerized environments. |
| `HORAQ_SIGNING_KEY` | `horaq_authority_key.json` | `/data/horaq_authority_key.json` | Path to persistent NIST FIPS 204 ML-DSA-65 authority key. Must be preserved across container restarts to prevent key invalidation. |
| `HORAQ_DEMO_MODE` | `false` | `true` | Enables public evaluation demo protections (blocks unauthenticated database wipes and administrative route seeding). |
| `HORAQ_ADMIN_TOKEN` | `""` | Strong entropy secret | Secret bearer token required for administrative baseline seeding (`POST /api/v1/baselines/seed`) and database resets when Demo Mode is active. |
| `HORAQ_LIVE_COLLECTOR` | `false` | `false` (Eval) / `true` (Live) | Controls the background RIPE RIS WebSocket collector task. Default `false` guarantees deterministic evaluation. |
| `HORAQ_RIS_URL` | `wss://ris-live.ripe.net/v1/stream/` | `wss://ris-live.ripe.net/v1/stream/` | Upstream WebSocket stream endpoint for live BGP UPDATE telemetry. |
| `HORAQ_CORS_ORIGINS` | `*` | `http://localhost:5173` | Comma-separated list of allowed frontend origins. |
| `PYTHON_VERSION` | `3.13.0` | `3.13.0` | Python runtime version for container builders. |

---

## 3. Local Execution & Containerized Deployment

### 3.1 Local Development Quickstart

1. **Backend Service**:
   ```bash
   cd D:\HORA-Q
   pip install -r backend/requirements.txt
   uvicorn backend.horaq.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Health Check*: Navigate to `http://localhost:8000/health` to confirm `status: "ok"`.

2. **Frontend Console**:
   ```bash
   cd D:\HORA-Q\frontend
   npm install
   npm run dev
   ```
   *Access Console*: Open `http://localhost:5173` in your browser.

---

### 3.2 Containerized Production Deployment (Docker / Podman)

For production deployment on enterprise servers or Kubernetes:

```dockerfile
# Backend Containerfile
FROM python:3.13-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY verify_evidence.py .
VOLUME ["/data"]
ENV HORAQ_DATABASE=/data/horaq.db
ENV HORAQ_SIGNING_KEY=/data/horaq_authority_key.json
ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "backend.horaq.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Containerfile (Nginx Reverse Proxy)
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. Operational Runbook for SOC Operators

### 4.1 Triaging an Anomaly Alert

When a `CRITICAL` or `HIGH` severity alert fires on the Operator Console:

```mermaid
flowchart TD
    A["Alert Notification Fired"] --> B{"Check Kind"}
    B -->|"SUBPREFIX_ANOMALY"| C["Longest Prefix Match (LPM) Interception"]
    B -->|"ORIGIN_CHANGE"| D["Origin AS Conflict"]
    
    C --> E["Inspect Corroborating Peers & Collector Sessions"]
    D --> E
    
    E --> F{"Corroboration Count >= 2?"}
    F -->|"Yes"| G["Confirmed Global Propagation (Incident PERSISTENT)"]
    F -->|"No"| H["Single-Peer Upstream Anomaly (Candidate Quarantined)"]
    
    G --> I["Query RPKI ROA Status (Live RIPEstat)"]
    H --> I
    
    I --> J{"RPKI Status"}
    J -->|"INVALID"| K["High-Confidence Malicious Hijack: Escalate to Peering NOC"]
    J -->|"VALID / UNKNOWN"| L["Investigate Planned Maintenance / Route Leak"]
    
    K --> M["Verify Cryptographic Evidence (FIPS 204 ML-DSA-65)"]
    L --> M
    M --> N["Export Notarized JSON Evidence Manifest"]
```

1. **Locate the Alert**: Open the **Alerts & Incidents** tab in the console.
2. **Review Prefix & Origins**:
   - Compare `affected_prefix` against `parent_prefix`.
   - Identify `observed_asn` vs `baseline_asn`.
3. **Verify Corroboration**:
   - Check the **Corroborating Peer Sessions** count.
   - If count is `1`, the event is an isolated peer anomaly or flap; candidate baseline quarantine prevents network contamination.
   - If count is $\ge 2$ across distinct collectors, global propagation has begun.
4. **Inspect RPKI Validation**:
   - Check RPKI badge: `VALID`, `INVALID`, `UNKNOWN`, or `HISTORICAL_RPKI_UNAVAILABLE`.
   - An `INVALID` status alongside multi-peer corroboration confirms a high-confidence hijack.
5. **Download Signed Evidence**:
   - Click **Verify Cryptography**.
   - Download the canonical `.json` evidence record for upstream ISP dispute resolution or regulatory filing.

---

### 4.2 Handling Route Withdrawals & Mitigation Verification

When the rogue autonomous system withdraws the hijacked route:

1. **Ingest Withdrawal**: The RIPE RIS collector receives the BGP `WITHDRAW` message.
2. **Automated Recovery State Machine**:
   - If the withdrawal covers a subset of announcing peers, the alert shifts to `recovery_status: PARTIAL`.
   - When all announcing peer sessions withdraw the route, the alert transitions to `status: RESOLVED` and `recovery_status: CONFIRMED`.
3. **Candidate De-escalation**: Quarantined candidate routes associated exclusively with the rogue origin are safely purged without affecting the legitimate baseline.

---

### 4.3 Database Maintenance & Performance Tuning

HORA-Q leverages SQLite in Write-Ahead Logging (WAL) mode for concurrent read-heavy operations:

```bash
# 1. Inspect Database Integrity
sqlite3 horaq.db "PRAGMA integrity_check;"

# 2. Check Active WAL Journal Mode and Pragma Settings
sqlite3 horaq.db "PRAGMA journal_mode; PRAGMA synchronous; PRAGMA busy_timeout;"

# 3. Force WAL Checkpoint (Flushes WAL back into main DB)
sqlite3 horaq.db "PRAGMA wal_checkpoint(TRUNCATE);"

# 4. Vacuum and Re-Index
sqlite3 horaq.db "VACUUM; REINDEX;"

# 5. Hot Backup Without Halting Service
sqlite3 horaq.db ".backup 'horaq_backup_$(date +%Y%m%d_%H%M%S).db'"
```

---

## 5. Continuous Integration & Quality Assurance

The project enforces automated testing and verification via GitHub Actions (`.github/workflows/ci.yml`):

```yaml
name: HORA-Q CI Pipeline
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      # 1. Backend Dependencies & Full Test Suite (138 tests)
      - name: Run Backend Pytest Suite
        run: |
          pip install -r backend/requirements.txt pytest
          python -m pytest backend/tests -v

      # 2. Historical Incident Replay & Benchmark Validation
      - name: Run Historical Incident Replay
        run: python backend/scripts/run_historical_replays.py

      - name: Run Reference Detector Benchmark
        run: python backend/scripts/run_benchmarks.py

      # 3. Independent Cryptographic CLI Verification
      - name: Verify Canonical Evidence Record
        run: python verify_evidence.py audit/sample_evidence_signed.json

      - name: Test Tamper Detection
        run: python verify_evidence.py audit/sample_evidence_signed.json --tamper || exit 0

      # 4. Frontend Typecheck & Production Bundle
      - name: Build Frontend Application
        run: |
          cd frontend
          npm ci
          npm run build
```
