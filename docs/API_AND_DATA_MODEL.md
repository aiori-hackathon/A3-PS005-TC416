# HORA-Q — API Specification & Data Model

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. REST API Specification (`/api/v1`)

The backend exposes an asynchronous REST API built with FastAPI. All endpoints are versioned under `/api/v1`, accept and return standard JSON, and use explicit HTTP status codes.

### System & Health Endpoints

#### `GET /health`
Returns service availability, operational parameters, and deployment mode.
```json
{
  "status": "ok",
  "service": "horaq-backend",
  "team": "A3-PS005-TC416",
  "version": "1.0.0",
  "demo_mode": false,
  "evaluation_mode": "SYNTHETIC_EVALUATION",
  "collector_enabled": false
}
```

#### `GET /api/v1/overview`
Aggregated operational metrics for dashboard telemetry.
- **Response**: `tracked_routes`, `total_observations`, `total_alerts`, `active_alerts`, `total_evidence`, `signed_evidence`, `latest_observation_time`, `crypto_status`, `collector_status`.

---

### Route Baselines & Versioned History

#### `GET /api/v1/routes`
List tracked route baselines with pagination, filtering, and status.
- **Parameters**: `limit` (default 50), `offset` (default 0), `search` (optional string filter).
- **Response**: `items: RouteBaseline[]`, `total: number`. Each item includes `prefix`, `origin_asn`, `status` (`PROMOTED` / `CANDIDATE` / `WITHDRAWN`), `peer_count`, `distinct_peers`, `observation_count`, `first_seen`, `last_seen`.

#### `POST /api/v1/baselines/seed`
Explicit administrative baseline establishment (Proposal Requirement D2).
- **Security**: In Demo Mode (`HORAQ_DEMO_MODE=true`), requires `X-Admin-Token` or `Authorization: Bearer <token>`.
- **Request Body**:
  ```json
  {
    "prefix": "192.0.2.0/24",
    "origin_asn": "AS64496",
    "collector": "authorized-seed",
    "reason": "Authorized ISP upstream allocation"
  }
  ```
- **Response**: `HTTP 201 Created` with established baseline record and append-only history transition confirmation.

#### `GET /api/v1/baselines/history`
Query the immutable baseline transition ledger.
- **Parameters**: `prefix` (optional filter), `limit` (default 50), `offset` (default 0).
- **Response**: List of chronological transition records (`transition_type`, `prior_status`, `new_status`, `peer_count`, `reason`, `actor`, `created_at`).

#### `GET /api/v1/routes/{prefix:path}/history`
Direct route-specific transition audit trail helper.

---

### Security Alerts & Triage

#### `GET /api/v1/alerts`
Paginated alerts query with status and kind filters.
- **Parameters**: `limit`, `offset`, `status` (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`), `kind` (`ORIGIN_CHANGE`, `SUBPREFIX_ANOMALY`).

#### `GET /api/v1/alerts/{alert_id}`
Detailed alert view with linked RFC 8785 evidence record and cryptographic signature payload.

#### `PATCH /api/v1/alerts/{alert_id}/status`
Update alert triage lifecycle status.
- **Request Body**: `{"status": "ACKNOWLEDGED"}` (or `"RESOLVED"`, `"ACTIVE"`).

---

### Telemetry Ingestion & Withdrawals

#### `POST /api/v1/observations`
Ingest incoming BGP route announcements.
- **Request Body**:
  ```json
  {
    "prefix": "192.0.2.128/25",
    "origin_asn": 64500,
    "collector": "rrc00",
    "timestamp": "2026-10-26T14:00:00Z",
    "metadata": {
      "peer_as": "AS64500",
      "as_path": [64500]
    }
  }
  ```
- **Response**: `HTTP 201 Created` with `observation_id`, `alerts_count`, and generated alerts list.
- **Security Invariant**: Untrusted callers cannot promote routes via metadata; wild observations enter as `CANDIDATE`.

#### `POST /api/v1/withdrawals`
Ingest BGP route withdrawal events and track per-peer recovery (Proposal Requirement D3).
- **Request Body**:
  ```json
  {
    "prefix": "192.0.2.128/25",
    "peer_as": "AS64500",
    "collector": "rrc00"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Processed BGP withdrawal for 192.0.2.128/25",
    "prefix": "192.0.2.128/25",
    "resolved_alerts": [
      {
        "alert_id": "alt-...",
        "status": "RESOLVED",
        "recovery_status": "CONFIRMED",
        "withdrawn_peers": ["AS64500"]
      }
    ],
    "unresolved_alerts": [],
    "recovered_candidate_routes": 1
  }
  ```

---

### Cryptography & Evidence Notarization

#### `GET /api/v1/evidence` & `GET /api/v1/evidence/{evidence_id}`
Retrieve immutable forensic evidence records with SHA-256 digests and ML-DSA signatures.

#### `POST /api/v1/evidence/{evidence_id}/sign`
Sign an evidence record using NIST FIPS 204 ML-DSA-65.
- **Strict Invariant**: Refuses classical algorithm substitution. If ML-DSA provider is unavailable, returns `HTTP 503 Service Unavailable`.

#### `POST /api/v1/evidence/verify-hash`
Verify SHA-256 digest against RFC 8785 canonical bytes.
- **Request Body**: `{"record": {...}, "expected_hash": "..."}`
- **Response**: `{"valid": boolean, "computed_hash": "...", "expected_hash": "..."}`

#### `POST /api/v1/evidence/verify`
Verify ML-DSA-65 digital signature using public key.
- **Request Body**: `{"record": {...}, "signature": "...", "public_key": "..."}`
- **Response**: `{"valid": boolean, "algorithm": "ML-DSA-65", "signer_authenticated": boolean}`

#### `GET /api/v1/crypto/status` & `GET /api/v1/crypto/public-key`
Query post-quantum provider readiness and export the authority public key.

---

### RPKI & Scenarios

#### `GET /api/v1/rpki/validate?prefix=...&asn=...`
Query live RIPEstat ROA validation client. Returns `VALID`, `INVALID`, `UNKNOWN`, or `UNAVAILABLE`.

#### `POST /api/v1/scenarios/{scenario_name}`
Execute reproducible evaluation scenarios: `baseline`, `origin-change`, `subprefix`, `legitimate-migration`, `ipv6-subprefix`, `withdrawal-recovery`, `run-all`, `seed-demo`, and `reset`.

---

## 2. Database Schema (SQLite WAL Mode)

```sql
-- 1. Route Baselines
CREATE TABLE IF NOT EXISTS baselines (
    prefix TEXT PRIMARY KEY,
    origin_asn TEXT NOT NULL,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    observation_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PROMOTED',
    peer_count INTEGER NOT NULL DEFAULT 1,
    distinct_peers TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
);

-- 2. Versioned Baseline History (Append-Only Audit Trail)
CREATE TABLE IF NOT EXISTS baseline_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prefix TEXT NOT NULL,
    origin_asn TEXT NOT NULL,
    prior_status TEXT,
    new_status TEXT NOT NULL,
    transition_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    peer_count INTEGER DEFAULT 1,
    observation_count INTEGER DEFAULT 1,
    actor TEXT DEFAULT 'SYSTEM_POLICY',
    created_at TEXT NOT NULL
);

-- 3. Security Anomaly Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    severity TEXT NOT NULL,
    kind TEXT NOT NULL,
    prefix TEXT NOT NULL,
    observed_asn TEXT NOT NULL,
    baseline_asn TEXT,
    parent_prefix TEXT,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    evidence_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    confidence TEXT DEFAULT 'HIGH',
    uncertainty_reason TEXT,
    collector TEXT NOT NULL,
    scenario TEXT,
    active_peers TEXT DEFAULT '[]',
    withdrawn_peers TEXT DEFAULT '[]',
    recovery_status TEXT DEFAULT 'UNCONFIRMED'
);

-- 4. Immutable Cryptographic Evidence Records
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL,
    schema_version TEXT NOT NULL DEFAULT '1.0.0',
    canonical_json TEXT NOT NULL,
    record_hash TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    signature TEXT,
    public_key TEXT,
    signer_status TEXT NOT NULL DEFAULT 'UNSIGNED',
    created_at TEXT NOT NULL,
    FOREIGN KEY(alert_id) REFERENCES alerts(id)
);

-- 5. Raw Telemetry Observations
CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prefix TEXT NOT NULL,
    origin_asn TEXT NOT NULL,
    collector TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    scenario TEXT,
    raw_metadata TEXT,
    peer_as TEXT,
    peer_ip TEXT,
    created_at TEXT NOT NULL
);
```
