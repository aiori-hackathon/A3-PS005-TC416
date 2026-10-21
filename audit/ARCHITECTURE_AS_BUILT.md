# HORA-Q — Architecture As-Built

**Project**: HORA Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (PS-005, Team A3-PS005-TC416)  

---

## 1. System Pipeline: As-Built

The actual runtime data flow implemented across [`horaq/`](file:///d:/HORA-Q/backend/horaq) follows seven distinct, auditable stages:

```
[ BGP Observation Source ]
  ├─ Manual / API Route Injection (POST /api/v1/observations)
  ├─ Scenario Runner Engine (POST /api/v1/scenarios/:name)
  └─ Opt-In RIPE RIS Live WebSocket (ws://ris-live.ripe.net/v1/ws/)
                 │
                 ▼
[ Stage 1: NORMALIZE (horaq/normalization.py) ]
  • normalize_prefix(): Strips host bits via ipaddress.ip_network(strict=False)
  • normalize_asn(): Strips 'AS' prefix, validates 1 <= ASN <= 4294967295 (rejects AS0, negative, ASDOT)
  • normalize_timestamp(): Enforces RFC 3339 UTC formatting
                 │
                 ▼
[ Stage 2: UNDERSTAND (horaq/database.py & detection.py) ]
  • SQLite ACID Session: SELECT from `baselines` table
  • Checks for exact prefix match vs established origin-AS
  • Computes IP address space family & CIDR boundary
                 │
                 ▼
[ Stage 3: DETECT (horaq/detection.py) ]
  • Test A (Subprefix Containment):
    Scans baselines via `find_parent_prefixes()`.
    Executes `child_net.subnet_of(parent_net)` across same IP family.
    If match found: Flags SUBPREFIX_ANOMALY (Longest Prefix Match threat).
  • Test B (Origin-AS Shift):
    If baseline exists AND `observed_asn != baseline_asn`:
    Flags ORIGIN_CHANGE (High severity).
    Crucial Rule: Baseline is NEVER overwritten or poisoned by suspicious announcements!
  • Test C (Baseline Seeding):
    If no baseline exists AND no parent anomaly: Seeds baseline with observation_count = 1.
                 │
                 ▼
[ Stage 4: CORRELATE & CONTEXT (horaq/rpki.py) ]
  • Queries RIPEstat ROA Validation endpoint (RFC 6483 / RFC 6811)
  • Resolves VALID, INVALID (ASN mismatch or max-length exceeded), UNKNOWN, or UNAVAILABLE
                 │
                 ▼
[ Stage 5: EXPLAIN (horaq/detection.py) ]
  • Generates transparent plain-language rationale explaining:
    - Longest Prefix Match (RFC 1812) traffic diversion
    - Competing Autonomous Systems
    - Operational context (DDoS scrubbing, TE vs malicious hijack)
                 │
                 ▼
[ Stage 6: EVIDENCE NOTARIZATION (horaq/evidence.py & crypto.py) ]
  • Serializes facts using RFC 8785 JSON Canonicalization Scheme (JCS)
  • Computes SHA-256 digest over canonical UTF-8 bytes
  • ML-DSA-65 (NIST FIPS 204) Module-Lattice signing (when liboqs available)
  • Atomic persistence to `observations`, `alerts`, `evidence` tables
                 │
                 ▼
[ Stage 7: VERIFY & MITIGATE (Frontend & API) ]
  • React/TypeScript Dashboard (Overview, Alerts, Audit Ledger, RPKI Inspector)
  • Live Tamper Simulation Sandbox (side-by-side mutation diff)
  • Operators execute edge mitigation: Block, Allow, or Ack
```

---

## 2. Persistence Layer Schema (SQLite in WAL Mode)

Database path: `d:\HORA-Q\backend\horaq.db` (configured via `settings.database_url`).

### Core Tables
1. **`baselines`**:
   - `prefix` (TEXT PRIMARY KEY) — Canonical CIDR string
   - `origin_asn` (TEXT NOT NULL) — Legitimate origin ASN (`ASxxxxx`)
   - `first_seen` (TEXT NOT NULL) — ISO 8601 UTC timestamp
   - `last_seen` (TEXT NOT NULL) — ISO 8601 UTC timestamp
   - `observation_count` (INTEGER DEFAULT 1) — Provenance counter
   - `updated_at` (TEXT NOT NULL)
2. **`observations`**:
   - `id` (TEXT PRIMARY KEY) — Unique observation UUID
   - `prefix` (TEXT NOT NULL)
   - `origin_asn` (TEXT NOT NULL)
   - `collector` (TEXT NOT NULL) — e.g. `manual`, `ripe-ris-live`, `scenario`
   - `timestamp` (TEXT NOT NULL)
   - `raw_metadata` (TEXT) — JSON serialized context
   - `created_at` (TEXT NOT NULL)
3. **`alerts`**:
   - `id` (TEXT PRIMARY KEY) — Unique alert ID
   - `created_at` (TEXT NOT NULL)
   - `severity` (TEXT NOT NULL) — `HIGH`, `MEDIUM`, `LOW`, `INFO`
   - `kind` (TEXT NOT NULL) — `ORIGIN_CHANGE` or `SUBPREFIX_ANOMALY`
   - `prefix` (TEXT NOT NULL)
   - `observed_asn` (TEXT NOT NULL)
   - `baseline_asn` (TEXT)
   - `parent_prefix` (TEXT)
   - `title` (TEXT NOT NULL)
   - `explanation` (TEXT NOT NULL)
   - `evidence_id` (TEXT NOT NULL)
   - `status` (TEXT DEFAULT 'ACTIVE') — `ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`
   - `collector` (TEXT NOT NULL)
   - `scenario` (TEXT)
4. **`evidence`**:
   - `id` (TEXT PRIMARY KEY) — Evidence record ID
   - `alert_id` (TEXT NOT NULL)
   - `schema_version` (TEXT NOT NULL) — `1.0.0`
   - `canonical_json` (TEXT NOT NULL) — Deterministic RFC 8785 byte string
   - `record_hash` (TEXT NOT NULL) — SHA-256 hexadecimal digest
   - `algorithm` (TEXT NOT NULL) — `ML-DSA-65`
   - `signature` (TEXT) — Base64 encoded signature
   - `public_key` (TEXT) — Base64 encoded public key
   - `signer_status` (TEXT NOT NULL) — `SIGNED`, `UNSIGNED`, `PROVIDER_UNAVAILABLE`
   - `created_at` (TEXT NOT NULL)

---

## 3. Communication Protocols

| Interface | Protocol | Port / Location | Security / Handling |
|---|---|---|---|
| Frontend to Backend API | HTTP/1.1 REST | `http://127.0.0.1:8000/api/v1` | Pydantic model validation, CORS enabled for local dev server |
| Vite Dev Server | HTTP/1.1 + HMR | `http://127.0.0.1:5173/` | Local proxy client |
| RIPE RIS Live Collector | WSS (WebSocket Secure) | `wss://ris-live.ripe.net/v1/ws/` | Opt-in background task, auto-reconnect with exponential backoff |
| RPKI Resolver | HTTPS REST | `https://stat.ripe.net/data/rpki-validation/data.json` | 5-second connection timeout, fallback to `UNAVAILABLE` |
