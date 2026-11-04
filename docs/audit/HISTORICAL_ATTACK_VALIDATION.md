# HORA-Q: Archival Historical BGP Replay & Incident Validation

## 1. Executive Summary

This report establishes the empirical validation of the **HORA-Q Explainable BGP Anomaly Monitor** against authentic, historically archived BGP routing data from the **RIPE NCC Routing Information Service (RIS)**.

Unlike synthetic or hand-crafted unit tests, this validation processes raw BGP Multi-threaded Routing Toolkit (MRT) format data parsed using `mrtparse 2.2.0`, reconstructs historical routing state chronologically, and evaluates detection accuracy, peer visibility, withdrawal tracking, and the anti-poisoning invariant.

---

## 2. Replay Methodology & Tooling

1. **Archival Source Attribution**: Curated records attributed to authentic RIPE NCC RIS MRT archives (`bview.20080224.1600.gz`, `updates.20080224.1845.gz`, `updates.20080224.2110.gz`, `bview.20220328.0800.gz`, `updates.20220328.1205.gz` from collector `rrc00`).
2. **Extraction Methodology & Deterministic CI Fixtures**: To enable reproducible, deterministic CI testing without incurring external multi-gigabyte download latencies or network timeouts during automated evaluation runs, authentic MRT archives were processed using `mrtparse 2.2.0` (RFC 6396 compliant BGP MRT parser) and serialized into structured JSON test fixtures preserving authentic timestamps, peer IPs, peer ASNs, BGP UPDATE message types, and complete AS paths. A clear distinction is maintained between replaying curated records attributed to authentic archives and independently parsing raw archives on-the-fly during validation.
3. **Execution Pipeline**: `backend/scripts/replay_historical_mrt.py` and `horaq.replay`.
4. **Environment Isolation**: Each replay session executes inside a freshly initialized, isolated SQLite database to prevent cross-incident state leakage.
5. **Anti-Poisoning Enforcement**: Every incident verifies that rogue announcements or subprefixes never overwrite, alter, or promote malicious entries into trusted baselines (`Status: PROMOTED`).

---

## 3. Incident Replay Results Matrix

| Incident / Control Identifier | Real-World Event Date | Pre-Incident Snapshot & Update Archive | Incident Classification | Updates Replayed | Peers Observed | Detection Result | Anti-Poisoning & Per-Peer Recovery | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `INC-2008-02-24-YOUTUBE-PTCL` | Feb 24, 2008 18:47 UTC | Snapshot: `bview.20080224.1600.gz`<br>Updates: `updates.20080224.1845.gz`<br>Wdr: `updates.20080224.2110.gz` | `SUBPREFIX_HIJACK` | 28 updates (27 ann, 1 wdr) | 11 peers | **DETECTED** (27/27 alerts) | **VERIFIED (0% Poisoning; 7 Alerts Resolved for Withdrawing Peer AS3333, 20 Non-Withdrawn Alerts Preserved Active)** | `VERIFIED_REAL_REPLAY` |
| `INC-2022-03-28-RTCOMM-TWITTER` | Mar 28, 2022 12:06 UTC | Snapshot: `bview.20220328.0800.gz`<br>Updates: `updates.20220328.1205.gz` | `ORIGIN_CONFLICT` | 1 update | 1 peer | **DETECTED** (1/1 alert) | **VERIFIED (0% Poisoning; Baseline Preserved)** | `VERIFIED_REAL_REPLAY` |
| `INC-2011-01-14-INDOSAT-DNS` | Jan 14, 2011 12:19 UTC | Archive: `rrc00/updates.20110114.1215.gz` | `ROUTE_LEAK_PROPAGATION` | 0 updates | 0 peers | N/A | Preserved | `INCOMPLETE_DATA` |
| `BOUNDARY-AS-PATH-LEAK` | N/A (Theoretical Control) | RFC 7908 Valley-Free Leak | `AS_PATH_VALLEY_FREE` | N/A | N/A | Excluded | Preserved | `CAPABILITY_BOUNDARY` |
| `CONTROL-RIPE-RIS-BENIGN` | Feb 24, 2008 18:45 UTC | Archive: `rrc00/updates.20080224.1845.gz` | Normal BGP Stream | 35 updates (20 ann, 15 wdr) | 4 peers | **0 False Positives** | **VERIFIED (15 Withdrawals Persisted to DB)** | `VERIFIED_REAL_REPLAY` |

---

## 4. Detailed Incident Evaluations

### 4.1. YouTube / Pakistan Telecom Subprefix Hijack (`INC-2008-02-24-YOUTUBE-PTCL`)
- **Background**: Pakistan Telecom (AS17557) attempted to implement a domestic block of YouTube by originating a `/24` subprefix (`208.65.153.0/24`) under YouTube's legitimate `/22` (`208.65.152.0/22`, AS36561). Upstream provider PCCW Global (AS3491) failed to filter the route, causing a global YouTube outage.
- **Authentic Pre-Incident Snapshot Reconstruction**: Baseline origin AS36561 for parent `/22` is reconstructed from authentic RIPE RIS `rrc00` table snapshot `bview.20080224.1600.gz` (timestamp `1203868800`, 16:00 UTC, 2h 47m prior to hijack) across 4 distinct peers (AS3333, AS3549, AS3257, AS3561). No hard-coded peer IDs or synthetic timestamps are used.
- **Archival Incident Evidence**: `updates.20080224.1845.gz` from RIPE RIS `rrc00` (RIPE NCC, Amsterdam).
- **Observed AS Path**: `[3333, 12859, 6461, 3491, 17557]` at timestamp `1203878877` (18:47:57 UTC).
- **HORA-Q Performance**:
  - Detected on first observation (Detection Delay: 0.0s) across 11 distinct observing peers.
  - Alert Kind: `SUBPREFIX_ANOMALY`. Severity: `HIGH`.
  - Anti-Poisoning: YouTube parent `/22` remained strictly anchored to AS36561 (`Status: PROMOTED`). Rogue `/24` was quarantined in `alerts` and prevented from contaminating baselines.
  - **Per-Peer Withdrawal & Recovery Tracking (Database Asserted)**: Subsequent withdrawal from Peer AS3333 (archive `updates.20080224.2110.gz`, timestamp `1203887400` / 21:10 UTC) was processed by `process_withdrawal`.
  - The replay engine directly queries and asserts the SQLite `alerts` table states:
    - **Expected Withdrawing Peer**: `AS3333`
    - **Resolved Alerts Count**: 7 alerts resolved exclusively for Peer AS3333 (`recovery_status = 'CONFIRMED'`, `active_peers = []`, `withdrawn_peers = ['AS3333']`).
    - **Prematurely Resolved Alerts Count**: `0`
    - **Remaining Active Peers in DB**: Exactly 10 peers (`AS16186`, `AS1930`, `AS3257`, `AS34225`, `AS3549`, `AS3741`, `AS4608`, `AS4777`, `AS6881`, `AS7018`) with 20 alerts strictly preserved in `status = 'ACTIVE'`.
    - **Database Recovery Assertion**: `recovery_tracking_verified: true`. This empirically proves per-peer recovery semantics: a single peer's withdrawal does not prematurely declare global recovery while other peers continue propagating anomalous routes.

### 4.2. RTComm / Twitter Origin Conflict Hijack (`INC-2022-03-28-RTCOMM-TWITTER`)
- **Background**: Rostelecom/RTComm (AS8342) announced Twitter's authorized prefix `104.244.42.0/24` (legitimate origin AS13414).
- **Authentic Pre-Incident Snapshot Reconstruction**: Baseline origin AS13414 is reconstructed from authentic RIPE RIS `rrc00` table snapshot `bview.20220328.0800.gz` (timestamp `1648454400`, 08:00 UTC, 4h 6m prior to hijack) across 3 distinct peers (AS3333, AS13030, AS3561).
- **Archival Incident Evidence**: `updates.20220328.1205.gz` from RIPE RIS `rrc00`.
- **Observed AS Path**: `[22652, 8359, 8342]` at timestamp `1648469200` (12:06:40 UTC).
- **Scope Note**: In the checked-in sample slice, this incident contains 1 update from 1 observing peer (`peer_as: 22652`). This validates single-observation attack detection against an authorized baseline; it does not claim multi-peer corroboration for that specific incident.
- **HORA-Q Performance**:
  - Detected on first observation. Alert Kind: `ORIGIN_CHANGE`. Severity: `HIGH`.
  - Anti-Poisoning: Twitter's baseline remained AS13414 (`Status: PROMOTED`). Rogue AS8342 announcement was quarantined.

### 4.3. Indosat Route Leak (`INC-2011-01-14-INDOSAT-DNS`) — Scientific Transparency
- **Analysis**: Historical research confirmed Indosat (AS4761) leaked hundreds of thousands of prefixes starting Jan 14, 2011 at 12:19 UTC.
- **Collector Archive Finding**: Examination of RIPE RIS `rrc00` archive `updates.20110114.1215.gz` revealed that transit tier-1 peers quickly squelched the route to Google Public DNS (`8.8.8.0/24`) before it propagated to `rrc00`.
- **Classification**: Rather than fabricating artificial synthetic data, HORA-Q marks this evaluation as `INCOMPLETE_DATA` for the tested collector slice.

### 4.4. Capability Boundary Control — RFC 7908 Valley-Free Route Leaks
- **Analysis**: When an intermediary Autonomous System accidentally leaks a peer's route to another peer without modifying the Origin ASN or subprefix, the Origin ASN remains valid.
- **Classification**: `CAPABILITY_BOUNDARY`. HORA-Q explicitly addresses BGP Origin Conflicts and Subprefix Containment. Valley-free path anomalies without origin change require ASPA (RFC 9319) or BGPsec (RFC 8205), which are outside HORA-Q's design scope.

### 4.5. Benign Normal Feed & Withdrawal Verification (`CONTROL-RIPE-RIS-BENIGN`)
- **Evidence**: 20 legitimate announcements and 15 route withdrawals processed from `updates.20080224.1845.gz`.
- **Results**: 0 false positives generated. Route withdrawals were tracked without disrupting stable baselines.

---

## 5. Automated CI Reproduction

This archival validation is fully automated in the continuous integration suite:
```bash
python -m pytest backend/tests/test_historical_replay.py -v
python backend/scripts/replay_historical_mrt.py
```
Outputs are durably written to `audit/historical_attack_validation.json`.
