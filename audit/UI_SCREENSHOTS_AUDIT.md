# HORA-Q — UI/UX Screenshot Audit & Page Inventory

> **Project**: HORA-Q (Explainable BGP Origin & Subprefix Anomaly Monitor)  
> **Hackathon**: AIORI-3 | Track 2 Cyber Security (PS-005) | Team **A3-PS005-TC416**  
> **Repository**: `https://github.com/aiori-hackathon/A3-PS005-TC416`  
> **Directory**: `d:\HORA-Q\audit\screenshots/`  
> **Design Standard**: Compliant with Inficy Gateway product simplicity (`--bg-app: #121214`)  

---

## Page Inventory & Verification

| # | Page / Modal | File Name | Primary Features Audited |
|---|---|---|---|
| **01** | **Overview Dashboard** | [`01_overview.png`](file:///d:/HORA-Q/audit/screenshots/01_overview.png) | System status card, 2x2 stats grid, 1-Click Interactive Evaluation Controller, 12-column Live Activity table, 24h timeline scrubber, Plain English Concept Guide. |
| **02** | **Security Alerts Center** | [`02_alerts.png`](file:///d:/HORA-Q/audit/screenshots/02_alerts.png) | Triage counter banner (`Critical Threats`, `Review Required`, `Acknowledged Today`), severity filters, Plain English summary callouts, `Block`/`Allow`/`Ack`/`Evidence` action buttons. |
| **03** | **Evidence Modal (Attestation)** | [`03_evidence_modal.png`](file:///d:/HORA-Q/audit/screenshots/03_evidence_modal.png) | 4-stage Cryptographic Notarization Pipeline (`Ingest` ➔ `Canonicalize (RFC 8785)` ➔ `Digest (SHA-256)` ➔ `Sign (ML-DSA-65)`), full canonical payload inspector. |
| **04** | **Evidence Tamper Verification**| [`04_tamper_verification.png`](file:///d:/HORA-Q/audit/screenshots/04_tamper_verification.png) | In-memory mutation simulator (`HIGH ➔ LOW`, `AS64505 ➔ AS0`), live SHA-256 hash mismatch alert (`Tamper detected`), side-by-side field diff, CLI verification copy helper. |
| **05** | **Route Baselines Table** | [`05_baselines.png`](file:///d:/HORA-Q/audit/screenshots/05_baselines.png) | Established prefix-to-origin trust store, observation counts, first-seen and last-seen timestamps, non-poisoning baseline policy badge. |
| **06** | **Scenario Runner** | [`06_scenarios.png`](file:///d:/HORA-Q/audit/screenshots/06_scenarios.png) | Full test suite scenarios (`Normal Route Baseline`, `Origin Conflict`, `Subprefix Infiltration`, `Traffic Shift Migration`), 1-click execution triggers with instant execution logs. |
| **07** | **Cryptographic Audit Ledger** | [`07_audit_ledger.png`](file:///d:/HORA-Q/audit/screenshots/07_audit_ledger.png) | Immutable 12-column audit log, RFC 8785 SHA-256 digests, verification badges, JSON export action. |
| **08** | **RPKI / ROA Inspector** | [`08_rpki_inspector.png`](file:///d:/HORA-Q/audit/screenshots/08_rpki_inspector.png) | Live RIPEstat ROA lookup tool, prefix and ASN query inputs, validity state mapping (`VALID`, `INVALID`, `UNKNOWN`), max-length compliance checks. |
| **09** | **Route Injection Tool** | [`09_inject_route.png`](file:///d:/HORA-Q/audit/screenshots/09_inject_route.png) | Custom BGP wire telemetry injector, CIDR normalization preview, collector selection, real-time pipeline ingestion trigger. |
| **10** | **System Settings & Health** | [`10_settings.png`](file:///d:/HORA-Q/audit/screenshots/10_settings.png) | SQLite WAL mode configuration, RIS Live WebSocket subscription status, Post-Quantum ML-DSA-65 engine diagnostics, log levels. |

---

## Screen-by-Screen Visual Walkthrough

### 1. Overview Dashboard
- **File**: [01_overview.png](file:///d:/HORA-Q/audit/screenshots/01_overview.png)
- **Description**: Displays the primary health status, active protected IP prefixes, tier-1 BGP peers, and the new 1-click Interactive Demonstration Pipeline allowing instant execution of normal, origin hijack, and subprefix scenarios.

---

### 2. Security Alerts Center
- **File**: [02_alerts.png](file:///d:/HORA-Q/audit/screenshots/02_alerts.png)
- **Description**: Live list of active threats with high-visibility Plain English summaries on each card, clarifying the impact (e.g. traffic redirection risk) for non-networking evaluators.

---

### 3. Cryptographic Evidence Modal
- **File**: [03_evidence_modal.png](file:///d:/HORA-Q/audit/screenshots/03_evidence_modal.png)
- **Description**: Displays the complete 4-stage notarization pipeline, RFC 8785 canonical key ordering, SHA-256 digest, and signature provider status.

---

### 4. Evidence Tamper Verification Sandbox
- **File**: [04_tamper_verification.png](file:///d:/HORA-Q/audit/screenshots/04_tamper_verification.png)
- **Description**: Demonstrates real-time tamper detection when incident values are mutated in memory, proving that forged evidence cannot pass SHA-256 integrity verification.

---

### 5. Route Baselines Table
- **File**: [05_baselines.png](file:///d:/HORA-Q/audit/screenshots/05_baselines.png)
- **Description**: The system's baseline memory mapping legitimate IP prefixes to authorized origin ASNs with observation timestamps and non-poisoning guarantees.

---

### 6. Scenario Runner
- **File**: [06_scenarios.png](file:///d:/HORA-Q/audit/screenshots/06_scenarios.png)
- **Description**: Interactive test workbench for triggering deterministic synthetic and replay scenarios with expected vs. actual alert counts.

---

### 7. Cryptographic Audit Ledger
- **File**: [07_audit_ledger.png](file:///d:/HORA-Q/audit/screenshots/07_audit_ledger.png)
- **Description**: Chronological ledger of all security incidents, each sealed with a SHA-256 fingerprint for tamper-evident compliance.

---

### 8. RPKI / ROA Inspector
- **File**: [08_rpki_inspector.png](file:///d:/HORA-Q/audit/screenshots/08_rpki_inspector.png)
- **Description**: Interactive tool to validate IP prefixes and ASNs against RIPEstat and cryptographic Route Origin Authorizations.

---

### 9. Route Injection Tool
- **File**: [09_inject_route.png](file:///d:/HORA-Q/audit/screenshots/09_inject_route.png)
- **Description**: Manual route injection interface to test boundary conditions, host-bit normalization, and custom AS paths.

---

### 10. System Settings & Engine Health
- **File**: [10_settings.png](file:///d:/HORA-Q/audit/screenshots/10_settings.png)
- **Description**: Diagnostics dashboard displaying database status, WebSocket collector health, and post-quantum cryptographic provider details.
