# HORA-Q — Security Operations Center (SOC) Console & Workflow Guide
### Visual Walkthrough, Forensic Triage Procedures, and Screenshot Reference

**Author**: Google SOC Security Engineering Team / AIORI-3 PS-005  
**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Target Audience**: Security Analysts, Incident Responders, Network Engineers, and Competition Evaluators  

---

## Executive Overview: The Analyst's Workspace

The HORA-Q Operator Console is engineered as an enterprise-grade Security Operations Center interface built with **React 18, TypeScript, Tailwind CSS, and Lucide icons**. It provides real-time visibility into global BGP telemetry, automated origin conflict detection, candidate baseline quarantine, cryptographic evidence notarization, and per-peer withdrawal remediation.

This guide walks through every primary view in the console, supported by the **12 canonical 16:9 high-resolution screenshots** captured from the production environment in [`audit/screenshots/`](../audit/screenshots/).

---

## Console Views & Visual Walkthrough

### 1. Security Overview Dashboard (`01_overview.png`)

The Overview view serves as the operational command center for the security analyst, aggregating real-time telemetry metrics, detection summaries, and active routing anomalies.

![Figure 1: Security Overview Dashboard](../audit/screenshots/01_overview.png)
*Figure 1: Production Overview Dashboard showing operating mode indicators, high-level route and anomaly counters, top active incidents, and recent BGP update activity.*

#### Key Panel Elements:
* **Operating Mode Banner**: Explicitly indicates whether the platform is running on **`LIVE`** RIPE RIS telemetry, **`SYNTHETIC`** testbed evaluation (RFC 5737 / RFC 3849), or **`HISTORICAL`** archival replay.
* **Core KPI Metrics Cards**:
  * **Tracked Baselines**: Active and candidate routing prefixes monitored.
  * **Evaluated Updates**: Total raw BGP announcements and withdrawals processed.
  * **Active Anomalies**: Real-time unresolved origin changes and subprefix hijacks.
  * **Signed Evidence Vault**: Total cryptographic attestation records notarized with ML-DSA-65.
* **Active Incident Spotlight**: Highlights the highest-priority security event requiring immediate operator review, with one-click access to the Forensic Investigation Drawer.
* **Real-time Observation Stream**: Displays recent BGP UPDATE ingestion with classification badges (`Baseline Seed`, `Origin Conflict`, `Subprefix Anomaly`, or `Announcement`).

---

### 2. Security Alerts & Grouped Incident Management (`02_alerts.png`)

The Alerts view presents a deduplicated, incident-correlated view of routing anomalies without discarding raw observation history.

![Figure 2: Security Alerts & Incidents View](../audit/screenshots/02_alerts.png)
*Figure 2: Security Alerts view displaying deduplicated incident cards, lifecycle classifications (TRANSIENT, PERSISTENT, RECURRENT), severity filters, and one-click remediation actions.*

#### Operational Triage Features:
* **Lifecycle Classification Badges**:
  * `TRANSIENT`: Short-lived anomaly ($< 300\text{s}$, $< 5$ events).
  * `PERSISTENT`: Sustained propagation ($\ge 300\text{s}$ or $\ge 5$ events).
  * `RECURRENT`: Anomaly reappearing after prior withdrawal resolution.
* **Corroboration Dimensions**: Displays distinct observing peer sessions, distinct peer ASNs, and collector vantage points.
* **Operator Actions**:
  * **Investigate**: Opens the full Forensic Incident Drawer.
  * **Ingest Withdrawal**: Simulates/processes an explicit BGP withdrawal from an active observing peer.
  * **Acknowledge**: Marks incident as under review by security personnel.
  * **Evidence**: Jumps directly to cryptographic audit record.

---

### 3. Forensic Incident Drawer & Corroboration Panel (`11_forensic_drawer.png`)

When an analyst clicks **Investigate**, the slide-over Forensic Incident Drawer opens, revealing the complete root-cause breakdown, telemetry facts, and peering state.

![Figure 3: Forensic Incident Drawer](../audit/screenshots/11_forensic_drawer.png)
*Figure 3: Forensic Incident Drawer detailing confirmed telemetry facts, LPM analysis, peering vantage corroboration, and live cryptographic verification controls.*

#### Analytical Sections:
1. **Confirmed Telemetry Facts vs. Operational Hypotheses**: Separates deterministic measurements (observed prefix, rogue ASN, baseline ASN, parent prefix scope) from benign hypotheses (CDN migration, DDoS scrubbing, intra-AS multi-homing).
2. **Detection Rule & Explainability**: Displays plain-English explanation, deterministic confidence score, and explicit uncertainty assessment.
3. **Per-Peer Withdrawal Recovery Matrix**: Real-time tracking of active vs. withdrawn peer sessions.
4. **Cryptographic Attestation Card**: Displays schema version (`1.1.0`), bound observation IDs, RFC 8785 canonical digest, and ML-DSA-65 digital signature.

---

### 4. Per-Peer Withdrawal Matrix (`11_forensic_drawer.png` & `02_alerts.png`)

HORA-Q solves the premature recovery problem by maintaining a discrete peering matrix:

```mermaid
graph LR
    subgraph ActivePeers["Active Observing Peers"]
        P1["Peer AS64511 (rrc00)"]
        P2["Peer AS64512 (rrc01)"]
    end
    
    subgraph Transition1["Withdrawal 1"]
        P1 -->|Withdrawal Received| W1["Withdrawn Peers: [AS64511]"]
        P2 -->|Still Announcing| A1["Remaining Active: [AS64512]"]
    end
    
    subgraph Transition2["Withdrawal 2"]
        P2 -->|Withdrawal Received| W2["All Peers Withdrawn!"]
    end
    
    A1 -->|Status: ACTIVE, Recovery: PARTIAL| Transition2
    W2 -->|Status: RESOLVED, Recovery: CONFIRMED| Remediation["Incident Auto-Remediated"]
```

* **PARTIAL Recovery**: If Peer A withdraws but Peer B continues announcing the rogue route, the alert remains `ACTIVE` with `recovery_status = 'PARTIAL'`.
* **CONFIRMED Recovery**: Only when all active observing peers have withdrawn does the alert transition to `RESOLVED`.

---

### 5. Cryptographic Evidence Vault & Post-Quantum Attestation (`03_evidence_modal.png`)

Every alert generated by HORA-Q is notarized in the immutable Evidence Vault. The Evidence Modal allows deep inspection of the cryptographic ledger.

![Figure 5: Cryptographic Evidence Modal](../audit/screenshots/03_evidence_modal.png)
*Figure 5: Cryptographic Evidence Modal displaying RFC 8785 canonical JSON payload, SHA-256 record hash, and NIST FIPS 204 ML-DSA-65 digital signature.*

#### Cryptographic Breakdown:
* **Canonical JSON (RFC 8785)**: Lexicographically sorted, whitespace-free serialization guaranteeing deterministic hashing across languages and architectures.
* **SHA-256 Digest**: 256-bit cryptographic digest calculated over the canonical payload.
* **ML-DSA-65 Post-Quantum Signature**: 3,309-byte digital signature generated using the system's secure local authority key.
* **Live In-Browser Verification**: Analysts click **Verify Hash & Signature** to execute real-time mathematical validation against the backend API.

---

### 6. Independent Tamper Verification (`04_tamper_verification.png`)

To prove mathematical non-repudiation, the platform includes a live tamper testing workspace.

![Figure 6: Independent Tamper Verification Workspace](../audit/screenshots/04_tamper_verification.png)
*Figure 6: Live Tamper Verification demonstrator proving that modifying a single character in the payload causes immediate cryptographic rejection (Exit Code 1).*

#### The 3-Step Verification Test:
1. **Baseline Proof**: Verify unaltered signed sample (`audit/sample_evidence_signed.json`) $\to$ **`[PASS] Authentic Record`**.
2. **Adversarial Tamper**: Inject a rogue origin ASN (`observed_asn: 99999`) or alter the timestamp.
3. **Cryptographic Rejection**: Run `verify_evidence.py` $\to$ **`[FAIL] TAMPER DETECTED: Computed digest does NOT match!`** (Exit code 1).

---

### 7. Route Baselines & Candidate Quarantine Table (`05_baselines.png`)

The Baselines view exposes HORA-Q's core defense against baseline poisoning.

![Figure 7: Route Baselines and Candidate Quarantine View](../audit/screenshots/05_baselines.png)
*Figure 7: Route Baselines view displaying trusted PROMOTED routes, quarantined CANDIDATE routes, peer session diversity counts, and baseline status filters.*

#### Table Columns & Security Fields:
* **Prefix & Origin ASN**: Authorized routing target and Autonomous System.
* **Status Badge**:
  * **`PROMOTED`**: Verified baseline corroborated by $\ge 2$ peer sessions and $\ge 3$ observations.
  * **`CANDIDATE`**: Newly observed route undergoing quarantine; cannot be used as an anomaly target until corroborated.
  * **`WITHDRAWN`**: Formerly active route withdrawn by announcing peers.
* **Peer Diversity**: Number of distinct peer sessions and peer ASNs that have observed the route.
* **Observation Count**: Cumulative BGP updates supporting the baseline entry.
* **Actions**: Inspect versioned baseline transition history.

---

### 8. Baseline Provenance & Versioned Audit Timeline (`12_baseline_timeline.png`)

Clicking **History** on any baseline route displays its complete, immutable provenance timeline.

![Figure 8: Baseline Provenance Timeline](../audit/screenshots/12_baseline_timeline.png)
*Figure 8: Baseline Provenance Timeline displaying historical status transitions, triggering observation IDs, peer counts, and authorized actors.*

#### Timeline Entry Schema:
* **Transition Type**: `INITIAL_SEED`, `PROMOTED_CORROBORATED`, `PEER_EXPANSION`, or `WITHDRAWAL`.
* **State Delta**: `None ➔ CANDIDATE`, `CANDIDATE ➔ PROMOTED`, or `PROMOTED ➔ WITHDRAWN`.
* **Provenance Anchor**: Exact `triggering_observation_id` from the raw observation table.
* **Actor Attribution**: `SYSTEM_POLICY`, `BENCHMARK_SEED`, or `OPERATOR_ADMIN`.

---

### 9. Evaluator Scenario Laboratory (`06_scenarios.png`)

The Scenarios view provides competition evaluators and security analysts with a one-click automated testing laboratory covering all major attack categories.

![Figure 9: Evaluator Scenario Laboratory](../audit/screenshots/06_scenarios.png)
*Figure 9: Evaluator Scenario Laboratory offering one-click automated replay of historical attacks, poisoning attempts, and single-peer flapping tests.*

#### Pre-Built Evaluator Scenarios:
1. **Baseline Seeding**: Ingests reference authorized prefixes for Google, Cloudflare, Quad9, and documentation networks.
2. **YouTube / PTCL Subprefix Hijack (2008)**: Replays the landmark hijack of `208.65.153.0/24` by Pakistan Telecom (AS17557) inside YouTube's parent `208.65.152.0/22` (AS36561).
3. **Twitter / RTComm Origin Conflict (2021)**: Replays Russian telco RTComm (AS8342) announcing Twitter's authorized prefix `104.244.42.0/24` (AS13414).
4. **Adversarial Baseline Poisoning Attack**: Injects a rogue announcement for Google DNS `8.8.8.0/24` from AS99999 to verify that HORA-Q alarms without contaminating its baseline.
5. **Candidate Baseline Quarantine & Flapping Test**: Injects multiple single-peer announcements to prove the candidate quarantine invariant.
6. **Per-Peer Anomaly Recovery**: Injects multi-peer announcements followed by partial and complete withdrawals.

---

### 10. Immutable Audit Ledger (`07_audit_ledger.png`)

The Audit Ledger provides an append-only, unfiltered view of every raw BGP update ingested by the platform.

![Figure 10: Immutable Audit Ledger View](../audit/screenshots/07_audit_ledger.png)
*Figure 10: Immutable Audit Ledger showing raw observation timestamps, peer IP/AS metadata, collector identifiers, and linked alert correlation IDs.*

* Every observation is assigned a monotonic integer `id`.
* Links directly to any resulting `alert_id` or `evidence_id`.
* Supports filtering by prefix, origin ASN, or scenario.

---

### 11. Live RPKI Origin Validation Inspector (`08_rpki_inspector.png`)

The RPKI Inspector view enables live, bounded queries to the official **RIPEstat REST API** to inspect the cryptographic Route Origin Authorization (ROA) status of any prefix and origin ASN.

![Figure 11: Live RPKI Origin Validation Inspector](../audit/screenshots/08_rpki_inspector.png)
*Figure 11: RPKI Origin Validation Inspector showing live ROA query results, maxLength validity, and explicit scope disclaimers.*

#### States & Explanations:
* **`VALID`**: Cryptographically signed ROA exists in RIR trust anchors authorizing the origin ASN and prefix length.
* **`INVALID`**: Covering ROA exists, but origin ASN does not match or prefix length exceeds `maxLength`.
* **`UNKNOWN`**: No covering ROA exists in global trust anchors (common for >50% of the Internet).
* **`UNAVAILABLE`**: RIPEstat provider timed out or returned HTTP 5xx (preserves provider distinction; never mislabeled as UNKNOWN).
* **`HISTORICAL_RPKI_UNAVAILABLE`**: Returned during historical replays when no time-matched ROA snapshot exists, preventing historical confusion.

---

### 12. BGP Route Injection & Candidate Sandbox (`09_inject_route.png`)

The Route Injection view allows security engineers to craft custom BGP announcements and withdrawals to test network policies.

![Figure 12: BGP Route Injection and Candidate Sandbox](../audit/screenshots/09_inject_route.png)
*Figure 12: Route Injection Sandbox allowing operators to inject custom announcements and withdrawals to verify candidate quarantine and alert generation.*

* Real-time client-side CIDR and ASN validation.
* Custom peering metadata injection (`peer_as`, `peer_ip`, `collector`).
* Instant response showing observation ID, candidate status, and generated alert count.

---

### 13. System Settings & Collector Diagnostics (`10_settings.png`)

The Settings view provides comprehensive diagnostics on background collector processes, cryptographic authority key fingerprints, and database statistics.

![Figure 13: System Settings & Collector Diagnostics](../audit/screenshots/10_settings.png)
*Figure 13: System Settings view detailing RIPE RIS Live collector telemetry, transport health state, ML-DSA-65 authority key fingerprints, and SQLite WAL database metrics.*

#### Diagnostic Panels:
* **Collector Health Telemetry**: Shows connection state (`CONNECTED`, `CONNECTED_NO_RECENT_UPDATES`, `DISCONNECTED`, `STALE_OR_UNKNOWN`), messages received, parsed, skipped, and reconnect count.
* **Post-Quantum Cryptographic Authority**: Algorithm details, NIST FIPS 204 standard status, and SHA-256 public key fingerprint.
* **Database Maintenance**: SQLite file size, active WAL journal size, and table row counts.

---

## Step-by-Step Incident Response Runbook

When a critical BGP anomaly occurs, the Google SOC analyst executes the following standard operating procedure:

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as SOC Analyst
    participant Alerts as Alerts View
    participant Drawer as Forensic Drawer
    participant RPKI as RPKI Inspector
    participant Ledger as Evidence Vault
    participant NetOps as Network Operations

    Analyst->>Alerts: Ingests & Views New HIGH Severity Alert
    Analyst->>Drawer: Clicks "Investigate" to open Forensic Drawer
    Drawer-->>Analyst: Displays Confirmed Facts: Prefix, Rogue ASN, Baseline Origin
    Analyst->>RPKI: Clicks "Check RPKI" to inspect ROA authorization
    RPKI-->>Analyst: Confirms RPKI Status (INVALID or UNKNOWN)
    Analyst->>Drawer: Reviews Per-Peer Corroboration (Sessions, ASNs, Collectors)
    Analyst->>Ledger: Validates ML-DSA-65 Cryptographic Attestation
    Analyst->>NetOps: Issues BGP Route Filtering Notice with Cryptographic Evidence Hash
    NetOps->>Alerts: Ingests Upstream Route Withdrawal
    Alerts-->>Analyst: Alert automatically transitions: ACTIVE ➔ RESOLVED (Recovery CONFIRMED)
```

1. **Detection & Triage**: Identify anomalous alert in `AlertsView` by prefix and severity.
2. **Forensic Inspection**: Open `ForensicIncidentDrawer` to verify origin mismatch and LPM subprefix containment.
3. **RPKI Correlation**: Cross-reference against RPKI trust anchors to evaluate cryptographic authorization.
4. **Corroboration Verification**: Confirm peer diversity across independent collector sessions to rule out local flapping.
5. **Cryptographic Attestation**: Verify ML-DSA-65 signature on evidence payload for audit logging.
6. **Remediation & Closure**: Monitor upstream BGP withdrawals via the Peer Recovery Matrix until status reaches `CONFIRMED`.
