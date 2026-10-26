# HORA-Q — Architecture As-Built

**Project**: HORA Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (PS-005, Team A3-PS005-TC416)  

---

## 1. System Pipeline: As-Built

The actual runtime data flow implemented across [`horaq/`](../backend/horaq) follows seven distinct, auditable stages:
```
[ Stage 1: INGESTION & NORMALIZATION (horaq/normalization.py) ]
  • normalize_prefix(): Strips host bits via ipaddress.ip_network(strict=False)
  • normalize_asn(): Validates 1 <= ASN <= 4294967295 (rejects AS0, negative, ASDOT)
  • normalize_timestamp(): Enforces RFC 3339 UTC formatting
  • Terminal AS_SET handling (RFC 6472)
                 │
                 ▼
[ Stage 2: HISTORICAL ROUTING STATE (horaq/database.py) ]
  • SQLite ACID Session in WAL mode: Query `baselines` table
  • Evaluates exact prefix match vs established origin-AS
  • Computes IP address space family & CIDR boundary
                 │
                 ▼
[ Stage 3: CANDIDATE BASELINE & PROMOTION POLICY (horaq/detection.py) ]
  • Unseeded routes enter state as `CANDIDATE`
  • Requires PROMOTION_THRESHOLD = 3 corroborating observations to reach `PROMOTED`
  • Quarantines transient route flaps from entering trusted reference state
                 │
                 ▼
[ Stage 4: ANOMALY DETECTION & ANTI-POISONING (horaq/detection.py) ]
  • Test A (Subprefix Containment):
    Scans baselines via `find_parent_prefixes()` across IP family.
    If match found: Flags SUBPREFIX_ANOMALY (Longest Prefix Match threat).
  • Test B (Origin-AS Shift):
    If baseline exists AND `observed_asn != baseline_asn`: Flags ORIGIN_CHANGE.
  • Anti-Poisoning Invariant:
    Suspicious announcements and subprefixes NEVER contaminate or overwrite baselines!
                 │
                 ▼
[ Stage 5: EVIDENCE CORRELATION & EXPLAINABLE UNCERTAINTY (horaq/detection.py & rpki.py) ]
  • Evaluates multi-source agreement across collectors & peers
  • Computes confidence rating (`HIGH`, `MEDIUM`, `UNCERTAIN`)
  • Preserves operational uncertainty reasons (e.g. Traffic Engineering deaggregations vs attacks)
  • Integrates on-demand RPKI ROA status (VALID, INVALID, UNKNOWN) via RIPEstat
                 │
                 ▼
[ Stage 6: POST-QUANTUM EVIDENCE NOTARIZATION (horaq/evidence.py & crypto.py) ]
  • Serializes facts using RFC 8785 JSON Canonicalization Scheme (JCS)
  • Computes SHA-256 digest over canonical UTF-8 bytes
  • Signs with NIST FIPS 204 ML-DSA-65 post-quantum digital signatures
  • Atomic persistence to `observations`, `alerts`, `evidence` tables
                 │
                 ▼
[ Stage 7: VERIFICATION, REVIEW & MITIGATION (Frontend & CLI) ]
  • React/TypeScript Operations Center UI (Overview, Alerts, Audit Ledger, RPKI Inspector)
  • Standalone verifier CLI (`verify_evidence.py`): Independent 4-state verification
  • Evaluators review evidence, simulate tamper, or inspect head-to-head benchmarks
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
   - `status` (TEXT NOT NULL DEFAULT 'PROMOTED') — `CANDIDATE` or `PROMOTED`
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
   - `confidence` (TEXT NOT NULL DEFAULT 'HIGH') — `HIGH`, `MEDIUM`, `UNCERTAIN`
   - `uncertainty_reason` (TEXT) — Explains why confidence is qualified
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
