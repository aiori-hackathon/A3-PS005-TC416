# HORA-Q — API Specification & Data Model

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  
**Standard**: Google SOC Enterprise Technical Specification  

---

## 1. REST API Architecture (`/api/v1`)

The HORA-Q backend exposes an asynchronous RESTful API engineered with **FastAPI** and **Python 3.13**. All endpoints are strictly versioned under `/api/v1`, accept and return standard UTF-8 JSON payloads, use explicit HTTP status codes, and enforce zero-trust input validation via **Pydantic v2** models.

```
+---------------------------------------------------------------------------------------------------------+
|                                      HORA-Q REST API Surface                                            |
|                                                                                                         |
|   +-----------------------+   +-----------------------+   +-----------------------+                     |
|   |   System & Health     |   |   Route Baselines     |   |   Security Alerts     |                     |
|   | GET /health           |   | GET /api/v1/routes    |   | GET /api/v1/alerts    |                     |
|   | GET /api/v1/overview  |   | POST /baselines/seed  |   | GET /alerts/{id}      |                     |
|   | GET /collector/status |   | GET /baselines/history|   | PATCH /alerts/{id}/st |                     |
|   +-----------------------+   +-----------------------+   +-----------------------+                     |
|                                                                                                         |
|   +-----------------------+   +-----------------------+   +-----------------------+                     |
|   |  Incident Correlation |   | Ingestion & Telemetry |   | Evidence & FIPS 204   |                     |
|   | GET /api/v1/incidents |   | POST /observations    |   | GET /api/v1/evidence  |                     |
|   | GET /incidents/{id}   |   | POST /withdrawals     |   | POST /evidence/sign   |                     |
|   |                       |   | GET /rpki/validate    |   | POST /evidence/verify |                     |
|   +-----------------------+   +-----------------------+   +-----------------------+                     |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Comprehensive Endpoint Catalog

### 2.1 System & Collector Health

#### `GET /health`
Returns service health, operational mode flags, and backend build parameters.
- **Access**: Public
- **Response Format**: `200 OK`
```json
{
  "status": "ok",
  "service": "horaq-backend",
  "team": "A3-PS005-TC416",
  "version": "1.1.0",
  "demo_mode": false,
  "evaluation_mode": "SYNTHETIC_EVALUATION",
  "collector_enabled": false
}
```

#### `GET /api/v1/overview`
Aggregated operational metrics for real-time SOC dashboard telemetry.
- **Access**: Public
- **Response Format**: `200 OK`
```json
{
  "tracked_routes": 42,
  "total_observations": 1284,
  "total_alerts": 8,
  "active_alerts": 3,
  "total_evidence": 8,
  "signed_evidence": 8,
  "latest_observation_time": "2026-10-28T10:45:00Z",
  "crypto_status": {
    "provider": "ml_dsa_65",
    "ready": true,
    "algorithm": "ML-DSA-65",
    "fips_standard": "FIPS 204"
  },
  "collector_status": {
    "enabled": false,
    "connected": false,
    "active_peer_sessions": 0,
    "messages_ingested": 0
  }
}
```

#### `GET /api/v1/collector/status`
Real-time diagnostic telemetry for live RIPE RIS WebSocket collector and historical replay streams.
- **Access**: Public
- **Response Format**: `200 OK`
```json
{
  "enabled": true,
  "connected": true,
  "transport": "WSS",
  "endpoint": "wss://ris-live.ripe.net/v1/stream/",
  "subscribed_collectors": ["rrc00", "rrc01", "rrc03"],
  "active_peer_sessions": 14,
  "messages_ingested": 45120,
  "announcements_parsed": 38200,
  "withdrawals_parsed": 6920,
  "messages_skipped": 0,
  "last_telemetry_timestamp": "2026-10-28T10:55:12Z",
  "reconnect_count": 0
}
```

---

### 2.2 Route Baselines & Audit Trail

#### `GET /api/v1/routes`
List tracked route baselines with pagination, prefix filtering, and candidate/promoted status.
- **Parameters**:
  - `limit` (*integer*, optional, default `50`): Max records to return.
  - `offset` (*integer*, optional, default `0`): Pagination offset.
  - `search` (*string*, optional): Substring filter on prefix or origin ASN.
- **Response Format**: `200 OK`
```json
{
  "items": [
    {
      "prefix": "192.0.2.0/24",
      "origin_asn": "AS64496",
      "status": "PROMOTED",
      "peer_count": 4,
      "distinct_peers": ["rrc00:AS64500", "rrc00:AS64501", "rrc01:AS64502", "rrc03:AS64503"],
      "corroborating_sessions": [
        "rrc00:AS64500:198.51.100.1",
        "rrc00:AS64501:198.51.100.2",
        "rrc01:AS64502:198.51.100.3"
      ],
      "observation_count": 18,
      "first_seen": "2026-10-26T12:00:00Z",
      "last_seen": "2026-10-28T10:45:00Z",
      "updated_at": "2026-10-28T10:45:00Z"
    }
  ],
  "total": 1
}
```

#### `POST /api/v1/baselines/seed`
Explicit administrative baseline establishment (Proposal Requirement D2).
- **Authentication**: Requires `X-Admin-Token` or `Authorization: Bearer <token>` when `HORAQ_DEMO_MODE=true`.
- **Request Body**:
```json
{
  "prefix": "192.0.2.0/24",
  "origin_asn": "AS64496",
  "collector": "authorized-seed",
  "reason": "Authorized primary allocation established by network engineering"
}
```
- **Response Format**: `201 Created`
```json
{
  "message": "Baseline seeded successfully",
  "prefix": "192.0.2.0/24",
  "origin_asn": "AS64496",
  "status": "PROMOTED",
  "history_id": 14
}
```

#### `GET /api/v1/baselines/history`
Query the immutable baseline transition ledger.
- **Parameters**: `prefix` (optional filter), `limit` (default 50), `offset` (default 0).
- **Response Format**: `200 OK`
```json
{
  "items": [
    {
      "id": 14,
      "prefix": "192.0.2.0/24",
      "origin_asn": "AS64496",
      "prior_status": null,
      "new_status": "PROMOTED",
      "transition_type": "ADMIN_SEED",
      "reason": "Authorized primary allocation established by network engineering",
      "peer_count": 1,
      "observation_count": 1,
      "actor": "ADMIN_OPERATOR",
      "created_at": "2026-10-26T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 2.3 Non-Destructive Incident Correlation

#### `GET /api/v1/incidents`
Query correlated routing security incidents aggregated across multiple collectors and peer sessions.
- **Parameters**:
  - `limit` (*integer*, optional, default `50`): Page size.
  - `offset` (*integer*, optional, default `0`): Pagination offset.
  - `lifecycle_status` (*string*, optional): Filter by `TRANSIENT`, `PERSISTENT`, or `RECURRENT`.
  - `recovery_status` (*string*, optional): Filter by `UNCONFIRMED`, `PARTIAL`, or `CONFIRMED`.
  - `prefix` (*string*, optional): Filter by affected child or parent prefix.
- **Response Format**: `200 OK`
```json
{
  "items": [
    {
      "id": "inc-subprefix-192-0-2-128-25-64500",
      "kind": "SUBPREFIX_ANOMALY",
      "prefix": "192.0.2.128/25",
      "origin_asn": "AS64500",
      "parent_prefix": "192.0.2.0/24",
      "baseline_asn": "AS64496",
      "lifecycle_status": "PERSISTENT",
      "first_seen": "2026-10-26T14:00:00Z",
      "last_seen": "2026-10-26T14:15:00Z",
      "alert_count": 2,
      "active_peers": ["AS64500", "AS64501"],
      "withdrawn_peers": [],
      "recovery_status": "UNCONFIRMED",
      "created_at": "2026-10-26T14:00:00Z",
      "updated_at": "2026-10-26T14:15:00Z"
    }
  ],
  "total": 1
}
```

#### `GET /api/v1/incidents/{incident_id}`
Retrieve complete forensic incident details including the chronological alert sequence, linked evidence records, and withdrawal progression.
- **Response Format**: `200 OK`
```json
{
  "id": "inc-subprefix-192-0-2-128-25-64500",
  "kind": "SUBPREFIX_ANOMALY",
  "prefix": "192.0.2.128/25",
  "origin_asn": "AS64500",
  "parent_prefix": "192.0.2.0/24",
  "baseline_asn": "AS64496",
  "lifecycle_status": "CONFIRMED_RESOLVED",
  "first_seen": "2026-10-26T14:00:00Z",
  "last_seen": "2026-10-26T14:22:00Z",
  "alert_count": 2,
  "active_peers": [],
  "withdrawn_peers": ["AS64500", "AS64501"],
  "recovery_status": "CONFIRMED",
  "alerts": [
    {
      "id": "alt-subprefix-1",
      "severity": "CRITICAL",
      "kind": "SUBPREFIX_ANOMALY",
      "evidence_id": "evi-subprefix-1",
      "created_at": "2026-10-26T14:00:00Z",
      "status": "RESOLVED"
    }
  ]
}
```

---

### 2.4 Security Anomaly Alerts & Triage

#### `GET /api/v1/alerts`
Paginated alerts query with status, severity, and kind filtering.
- **Parameters**: `limit`, `offset`, `status` (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`), `kind` (`ORIGIN_CHANGE`, `SUBPREFIX_ANOMALY`).
- **Response Format**: `200 OK`

#### `GET /api/v1/alerts/{alert_id}`
Detailed alert view with linked RFC 8785 evidence record and cryptographic signature payload.
- **Response Format**: `200 OK`
```json
{
  "id": "alt-subprefix-001",
  "created_at": "2026-10-26T14:00:00Z",
  "severity": "CRITICAL",
  "kind": "SUBPREFIX_ANOMALY",
  "prefix": "192.0.2.128/25",
  "observed_asn": "AS64500",
  "baseline_asn": "AS64496",
  "parent_prefix": "192.0.2.0/24",
  "title": "Unauthorized Subprefix Announcement: 192.0.2.128/25 by AS64500",
  "explanation": "Observed more-specific /25 route inside authorized /24 parent baseline. All traffic to 192.0.2.128/25 will be intercepted via Longest Prefix Match (LPM).",
  "evidence_id": "evi-subprefix-001",
  "status": "ACTIVE",
  "confidence": "HIGH",
  "collector": "rrc00",
  "incident_id": "inc-subprefix-192-0-2-128-25-64500",
  "observation_id": 84,
  "corroboration_count": 2,
  "corroborating_peers": ["rrc00:AS64500:198.51.100.1", "rrc00:AS64501:198.51.100.2"],
  "active_peers": ["AS64500", "AS64501"],
  "withdrawn_peers": [],
  "recovery_status": "UNCONFIRMED"
}
```

#### `PATCH /api/v1/alerts/{alert_id}/status`
Update alert SOC triage lifecycle status.
- **Request Body**: `{"status": "ACKNOWLEDGED"}` (or `"RESOLVED"`, `"ACTIVE"`).
- **Response Format**: `200 OK`

---

### 2.5 Telemetry Ingestion & Per-Peer Withdrawals

#### `POST /api/v1/observations`
Ingest incoming BGP route announcements. Wild observations enter as `CANDIDATE` and are evaluated against active baselines.
- **Request Body**:
```json
{
  "prefix": "192.0.2.128/25",
  "origin_asn": 64500,
  "collector": "rrc00",
  "timestamp": "2026-10-26T14:00:00Z",
  "metadata": {
    "peer_as": "AS64500",
    "peer_ip": "198.51.100.1",
    "as_path": [64500]
  }
}
```
- **Response Format**: `201 Created`
```json
{
  "message": "Observation processed",
  "observation_id": 84,
  "alerts_count": 1,
  "alerts": [
    {
      "id": "alt-subprefix-001",
      "severity": "CRITICAL",
      "kind": "SUBPREFIX_ANOMALY",
      "prefix": "192.0.2.128/25",
      "observed_asn": "AS64500"
    }
  ]
}
```

#### `POST /api/v1/withdrawals`
Ingest BGP route withdrawal events and evaluate per-peer recovery across active incidents.
- **Request Body**:
```json
{
  "prefix": "192.0.2.128/25",
  "peer_as": "AS64500",
  "peer_ip": "198.51.100.1",
  "collector": "rrc00"
}
```
- **Response Format**: `200 OK`
```json
{
  "message": "Processed BGP withdrawal for 192.0.2.128/25",
  "prefix": "192.0.2.128/25",
  "resolved_alerts": [
    {
      "alert_id": "alt-subprefix-001",
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

### 2.6 Cryptography & Evidence Notarization

#### `GET /api/v1/evidence` & `GET /api/v1/evidence/{evidence_id}`
Retrieve immutable forensic evidence records with SHA-256 digests and ML-DSA-65 post-quantum signatures.

#### `POST /api/v1/evidence/{evidence_id}/sign`
Sign an evidence record using the authority NIST FIPS 204 ML-DSA-65 key.
- **Strict Invariant**: Refuses classical algorithm downgrade. Returns `503 Service Unavailable` if the ML-DSA provider is offline.

#### `POST /api/v1/evidence/verify-hash`
Verify SHA-256 digest against RFC 8785 canonical bytes.
- **Request Body**: `{"record": {...}, "expected_hash": "..."}`
- **Response Format**: `{"valid": true, "computed_hash": "...", "expected_hash": "..."}`

#### `POST /api/v1/evidence/verify`
Verify ML-DSA-65 digital signature using the authority public key.
- **Request Body**: `{"record": {...}, "signature": "...", "public_key": "..."}`
- **Response Format**: `{"valid": true, "algorithm": "ML-DSA-65", "signer_authenticated": true}`

#### `GET /api/v1/crypto/status` & `GET /api/v1/crypto/public-key`
Query post-quantum provider readiness and export the authority public key in Base64 encoding.

---

## 3. Database Schema Specification (SQLite WAL)

HORA-Q stores all operational data in SQLite configured in **Write-Ahead Logging (WAL)** mode. Foreign keys and parameterized SQL queries prevent SQL injection and transaction deadlocks.

```sql
-- 1. Route Baselines Table
CREATE TABLE IF NOT EXISTS baselines (
    prefix TEXT PRIMARY KEY,
    origin_asn TEXT NOT NULL,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    observation_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PROMOTED',
    peer_count INTEGER NOT NULL DEFAULT 1,
    distinct_peers TEXT NOT NULL DEFAULT '[]',
    corroborating_sessions TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
);

-- 2. Versioned Baseline History Table (Append-Only Audit Trail)
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

-- 3. Security Anomaly Incidents Table (Correlated Parent Entity)
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    prefix TEXT NOT NULL,
    origin_asn TEXT NOT NULL,
    parent_prefix TEXT,
    baseline_asn TEXT,
    lifecycle_status TEXT NOT NULL DEFAULT 'TRANSIENT',
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    alert_count INTEGER NOT NULL DEFAULT 1,
    active_peers TEXT NOT NULL DEFAULT '[]',
    withdrawn_peers TEXT NOT NULL DEFAULT '[]',
    recovery_status TEXT NOT NULL DEFAULT 'UNCONFIRMED',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 4. Security Anomaly Alerts Table
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
    recovery_status TEXT DEFAULT 'UNCONFIRMED',
    incident_id TEXT,
    observation_id INTEGER,
    corroboration_count INTEGER DEFAULT 1,
    corroborating_peers TEXT DEFAULT '[]',
    FOREIGN KEY(incident_id) REFERENCES incidents(id)
);

-- 5. Immutable Cryptographic Evidence Records Table
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL,
    schema_version TEXT NOT NULL DEFAULT '1.1.0',
    canonical_json TEXT NOT NULL,
    record_hash TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    signature TEXT,
    public_key TEXT,
    signer_status TEXT NOT NULL DEFAULT 'UNSIGNED',
    created_at TEXT NOT NULL,
    FOREIGN KEY(alert_id) REFERENCES alerts(id)
);

-- 6. Raw Telemetry Observations Table
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
    session_key TEXT,
    created_at TEXT NOT NULL
);
```

---

## 4. Evidence Record Schema Specification (Schema v1.1.0)

Every security alert generated by HORA-Q is sealed as an RFC 8785 canonical JSON evidence record. Schema v1.1.0 introduces the **provenance manifest** to bind observations to their physical source and dataset hash:

```json
{
  "schema_version": "1.1.0",
  "evidence_id": "evi-subprefix-192-0-2-128-25",
  "incident_id": "inc-subprefix-192-0-2-128-25-64500",
  "alert": {
    "id": "alt-subprefix-001",
    "kind": "SUBPREFIX_ANOMALY",
    "severity": "CRITICAL",
    "timestamp": "2026-10-26T14:00:00Z",
    "collector": "rrc00"
  },
  "provenance": {
    "telemetry_source": "RIPE_RIS_MRT_ARCHIVE",
    "collector": "rrc00",
    "collector_transport": "MRT_BVIEW",
    "ingestion_timestamp": "2026-10-28T10:45:00Z",
    "observed_timestamp": "2026-10-26T14:00:00Z",
    "dataset_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "observation_id": 84,
    "peer_session": "rrc00:AS64500:198.51.100.1",
    "clock_honest": true
  },
  "anomaly": {
    "affected_prefix": "192.0.2.128/25",
    "observed_origin_asn": "AS64500",
    "baseline_origin_asn": "AS64496",
    "parent_prefix": "192.0.2.0/24",
    "longest_prefix_match_hijack": true
  },
  "rpki": {
    "status": "INVALID",
    "validation_timestamp": "2026-10-26T14:00:00Z",
    "validator": "RIPEstat_Data_API"
  },
  "corroboration": {
    "distinct_peer_sessions": 2,
    "peer_sessions": [
      "rrc00:AS64500:198.51.100.1",
      "rrc00:AS64501:198.51.100.2"
    ]
  }
}
```

### Verification Invariants
1. **RFC 8785 Serialization**: Keys are sorted by UTF-16 code units, integers are formatted without trailing zeroes, whitespace is eliminated.
2. **SHA-256 Digest**: Computed over the UTF-8 bytes of the canonical JSON string.
3. **ML-DSA-65 Signature**: Computed over the SHA-256 digest bytes using the NIST FIPS 204 private lattice key.
4. **Backward Compatibility**: Verifier tools accept both Schema v1.0.0 and Schema v1.1.0 records transparently.
