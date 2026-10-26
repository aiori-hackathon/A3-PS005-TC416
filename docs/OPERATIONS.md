# HORA-Q — Operations, Configuration & Deployment

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. Operational Configuration & Environment Variables

All backend configuration is managed cleanly through Pydantic Settings (`horaq/config.py`). Values can be set via environment variables or a `.env` file in the working directory:

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `HORAQ_DATABASE` | `horaq.db` | Path to SQLite database file. In production, mount on persistent volume. |
| `HORAQ_SIGNING_KEY` | `horaq_authority_key.json` | Path to persistent NIST FIPS 204 ML-DSA-65 authority key. Must be persistent across container restarts. |
| `HORAQ_DEMO_MODE` | `false` | Enables public evaluation demo protections (blocks destructive database wipes and unauthenticated observation injection). |
| `HORAQ_ADMIN_TOKEN` | `""` | Secret token required for administrative baseline seeding and full resets when Demo Mode is active. |
| `HORAQ_LIVE_COLLECTOR` | `false` | Enables live RIPE RIS WebSocket collector. Defaults to `false` for reproducible offline evaluation. |
| `HORAQ_RIS_URL` | `wss://ris-live.ripe.net/v1/stream/` | WebSocket endpoint for live RIPE RIS telemetry stream. |
| `HORAQ_CORS_ORIGINS` | `*` | Comma-separated list of allowed frontend origins (e.g. `https://your-frontend.pages.dev,http://localhost:5173`). Wildcards like `*.pages.dev` are supported. |
| `PORT` | `8000` | HTTP port for FastAPI service. |

---

## 2. Database Maintenance & Persistence

HORA-Q uses SQLite with **Write-Ahead Logging (WAL)** enabled by default:

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
```

### Operational Advantages of WAL Mode
1. **Concurrency**: Readers never block writers, and writers never block readers. Live telemetry updates can be inserted while the frontend polls overview stats.
2. **Crash Resilience**: Atomic commits protect baseline and evidence records against sudden power loss or container crashes.
3. **Performance**: Commits write sequentially to the `-wal` log file rather than re-writing database pages immediately.

### Maintenance Commands
```bash
# Check database integrity:
sqlite3 horaq.db "PRAGMA integrity_check;"

# Force WAL checkpoint:
sqlite3 horaq.db "PRAGMA wal_checkpoint(FULL);"

# Vacuum and optimize storage:
sqlite3 horaq.db "VACUUM;"
```

---

## 3. Live RIPE RIS WebSocket Telemetry Collector

When `HORAQ_LIVE_COLLECTOR=true` is set, the background collector task (`backend/horaq/collector.py`) connects to RIPE RIS Live:

- **Subscribed Remote Route Collectors (RRCs)**: `rrc00` (Amsterdam / AMS-IX), `rrc01` (London / LINX), `rrc03` (Amsterdam).
- **Stream Filter**: Subscribes to BGP `UPDATE` messages across IPv4 and IPv6 address families.
- **Normalization**:
  - Extracts `data.peer` $\to$ `peer_ip`.
  - Extracts `data.peer_asn` $\to$ `peer_as`.
  - Extracts `data.host` $\to$ `collector`.
  - Routes announcements to `process_observation`.
  - Routes route withdrawals directly to `process_withdrawal`.
- **Automatic Reconnection**: Implements exponential backoff reconnect logic with jitter to maintain continuous streaming.
- **Diagnostics Endpoint**: `GET /api/v1/collector/status` reports connected state, messages received, parsed, and skipped.

---

## 4. Continuous Integration Pipeline (`.github/workflows/ci.yml`)

The GitHub Actions CI pipeline runs on every push and pull request to `main`:

```yaml
name: HORA-Q CI Pipeline
on:
  push:
    branches: [ main, chore/**, fix/**, feat/** ]
  pull_request:
    branches: [ main ]

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

      # 1. Backend Dependencies & Tests
      - name: Install Python Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r backend/requirements.txt pytest

      - name: Run Pytest Test Suite
        run: python -m pytest backend/tests -v

      # 2. Historical Replay & Reference Benchmark
      - name: Run Historical Incident Replay
        run: python backend/scripts/run_historical_replays.py

      - name: Run Reference Detector Benchmark
        run: python backend/scripts/run_benchmarks.py

      # 3. Independent CLI Verifier & Tamper Tests
      - name: Verify Signed Evidence Record
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

---

## 5. Deployment Topology

For public presentation and evaluation, refer to the complete deployment guide in [`DEPLOYMENT.md`](../DEPLOYMENT.md):
- **Frontend SPA**: Hosted on Cloudflare Pages with globally distributed edge caching.
- **Backend Service**: Containerized on Railway with a persistent 1 GB volume mount (`/data`) storing `horaq.db` and `horaq_authority_key.json`.
