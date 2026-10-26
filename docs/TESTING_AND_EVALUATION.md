# HORA-Q — Testing, Benchmarks & Empirical Evaluation

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. Automated Test Suite (92 Tests)

The backend features 92 comprehensive automated tests executed via `pytest`. All tests execute deterministically against an in-memory SQLite database without requiring live external internet connections.

### Test Execution Command
```bash
python -m pytest backend/tests -v
```

### Module Breakdown

| Test Module | Tests | Primary Invariants Verified |
| :--- | :--- | :--- |
| [`test_api.py`](../backend/tests/test_api.py) | 17 | REST API status codes; Pydantic validation; Demo Mode protection; unauthorized seed barrier; authorized seeding; per-peer withdrawal endpoints; recovery scenarios. |
| [`test_detection.py`](../backend/tests/test_detection.py) | 15 | Origin conflict detection; subprefix containment; candidate baseline quarantine; peer diversity invariant; per-peer withdrawal recovery; duplicate withdrawal idempotency. |
| [`test_evidence.py`](../backend/tests/test_evidence.py) | 16 | RFC 8785 canonical key ordering; surrogate pair sorting; SHA-256 tamper detection; byte parity with CLI; unsigned vs signed separation. |
| [`test_crypto.py`](../backend/tests/test_crypto.py) | 12 | ML-DSA-65 FIPS 204 dimensions; transparent provider status; persistent authority key lifecycle; refusal of classical substitution; corrupted key rejection. |
| [`test_normalization.py`](../backend/tests/test_normalization.py) | 15 | Host-bit zeroing (IPv4 & IPv6); ASN validation (rejects AS0, negative, ASDOT, >32-bit); ISO 8601 timestamp parsing. |
| [`test_collector.py`](../backend/tests/test_collector.py) | 9 | AS-Path parsing; AS-Set handling; withdrawal-only message normalization; live collector peer metadata and withdrawal routing. |
| [`test_historical_replay.py`](../backend/tests/test_historical_replay.py) | 3 | Chronological replay of archival MRT BGP dumps; authentic pre-incident baseline reconstruction; withdrawal and recovery verification. |
| [`test_benchmark.py`](../backend/tests/test_benchmark.py) | 2 | 14-case head-to-head comparison metrics; live CPU cryptographic latency benchmarks (ML-DSA-65 vs Ed25519 vs RSA-2048). |
| [`test_rpki.py`](../backend/tests/test_rpki.py) | 4 | RIPEstat REST client parsing; ROA validity states; HTTP timeout handling; network error resilience (`UNAVAILABLE`). |

---

## 2. Head-to-Head Reference Benchmark (14 Cases)

Proposal Page 6 defines an empirical comparison between a **Naïve Reference Detector** (standard threshold-based detector that immediately accepts observations) and **Enhanced HORA-Q** (with candidate quarantine and multi-peer corroboration).

The benchmark is executed via [`backend/horaq/benchmark.py`](../backend/horaq/benchmark.py) and documented in [`audit/reference_detector_comparison.json`](../audit/reference_detector_comparison.json):

### Summary Comparison Table

| Metric | Naïve Reference Detector | Enhanced HORA-Q | Evaluation Impact |
| :--- | :--- | :--- | :--- |
| **Stream Instances** | 14 calibrated BGP events | 14 calibrated BGP events | Identical detection geometry |
| **Precision** | 80.0% (8/10) | 80.0% (8/10) | Equal detection power |
| **Recall (Sensitivity)** | 100.0% (8/8) | 100.0% (8/8) | Zero missed attacks |
| **F1 Score** | 0.8889 | 0.8889 | High overall balance |
| **False Positive Rate** | 10.0% (1/10) | 10.0% (1/10) | Controlled on calibrated stream |
| **Baseline Contamination** | **75.0% (6/8 poisoned)** | **0.0% (0/8 poisoned)** | **Critical Advantage: Complete anti-poisoning** |
| **Single-Peer Flapping** | Promoted (Poisoned) | Quarantined (`CANDIDATE`) | Rejection of uncorroborated churn |

### Cryptographic Overhead Benchmarking (50 Iterations on Local CPU)

| Algorithm | Standard / RFC | Signature Size | Public Key Size | Mean Sign Latency | Mean Verify Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ML-DSA-65** | **NIST FIPS 204** | **3,309 bytes** | **1,952 bytes** | **81.69 ms** | **13.85 ms** |
| **Ed25519** | RFC 8032 | 64 bytes | 32 bytes | 0.047 ms | 0.144 ms |
| **RSA-2048** | PKCS #1 v2.2 | 256 bytes | 294 bytes | 0.725 ms | 0.051 ms |

**Engineering Tradeoff**: ML-DSA-65 signatures are ~52× larger than Ed25519 and incur ~81 ms signing latency. Because HORA-Q generates cryptographic evidence **per-incident/alert** rather than per-packet on wire-rate routers, this latency and storage overhead is operationally feasible and necessary to achieve post-quantum security.

---

## 3. Archival MRT Historical Incident Replay

The historical evaluation engine ([`backend/horaq/replay.py`](../backend/horaq/replay.py)) replays authentic BGP records from real-world routing incidents archived by RIPE RIS and Route Views:

```bash
python backend/scripts/run_historical_replays.py
```

### Replay Case Inventory & Classification

1. **YouTube / PTCL Subprefix Hijack (2008) — [COMPLETED REPLAY]**:
   - **Prefix**: `208.65.153.0/24` (Legitimate origin: YouTube AS36561).
   - **Attack**: Pakistan Telecom (AS17557) announced more-specific `208.65.153.0/25` to block access locally, which leaked upstream to PCCW (AS3491) and propagated globally.
   - **HORA-Q Outcome**: Reconstructed pre-incident baseline from authentic `bview` table dump. Flagged `/25` subprefix anomaly immediately. Processed authentic withdrawal messages from observing peers; confirmed full recovery upon peer withdrawal.
2. **RTComm / Twitter Origin Conflict (2021) — [COMPLETED REPLAY]**:
   - **Prefix**: `104.244.42.0/24` (Legitimate origin: Twitter AS13414).
   - **Attack**: Rostelecom/RTComm (AS8342) announced Twitter's prefix during domestic blocking actions.
   - **HORA-Q Outcome**: Established pre-incident Twitter baseline. Detected unauthorized origin change to AS8342. Baseline remained strictly unpoisoned.
3. **Indosat Leak / Hijack (2011) — [INCOMPLETE HISTORICAL EVALUATION]**:
   - **Incident**: Indosat (AS4761) announced hundreds of thousands of foreign routes.
   - **Scientific Classification**: Classified honestly as an **incomplete historical evaluation** due to missing pre-incident baseline RIB snapshots in public archives. Demonstrates the need for historical baseline archives.
4. **RFC 7908 Capability Boundary — [BOUNDARY CASE]**:
   - **Scenario**: A route leak where an intermediate transit AS re-advertises a customer route to another provider (valley-free violation) without altering the origin AS or prefix length.
   - **HORA-Q Classification**: Correctly classified as an architectural **boundary case**. Because the origin AS and prefix length remain unchanged, AS-Path-only valley leaks without origin changes are explicitly beyond HORA-Q's origin/subprefix scope.
5. **Benign Control Stream — [CONTROL CASE]**:
   - **Data**: Archival RIPE RIS update stream (`rrc00/updates.20080224.1845.gz`).
   - **Outcome**: 20 announcements, 15 withdrawals processed with **zero false positive alerts** and verified withdrawal state persistence.
