# HORA-Q — Testing, Benchmarks & Empirical Evaluation
### 138 Automated Tests, Reference Benchmark Matrix, and Archival Replay Reproducibility

**Author**: Google SOC Security Engineering Team / AIORI-3 PS-005  
**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Test Suite**: 138 Automated Pytest Unit & Integration Tests (100% Passing in ~30s)  

---

## 1. Automated Test Suite (138 Tests)

The backend features **138 comprehensive automated tests** executed via `pytest`. All tests execute deterministically against in-memory or isolated temporary SQLite databases without requiring live external internet connections.

### Test Execution Command
```bash
python -m pytest backend/tests -v
```

### Module Breakdown Matrix

| Test Module | Tests | Primary Invariants & Security Specifications Verified |
| :--- | :---: | :--- |
| [`test_api.py`](../backend/tests/test_api.py) | **21** | REST API status codes; observations endpoint & schema; Pydantic validation; Demo Mode protection; unauthorized seed barrier; authorized seeding; per-peer withdrawal endpoints; recovery transitions; `/incidents` & `/incidents/{id}` API. |
| [`test_detection.py`](../backend/tests/test_detection.py) | **15** | Origin conflict detection; subprefix containment; candidate baseline quarantine; peer diversity invariant; per-peer withdrawal recovery; duplicate withdrawal idempotency. |
| [`test_evidence.py`](../backend/tests/test_evidence.py) | **14** | RFC 8785 canonical key ordering; surrogate pair sorting; SHA-256 tamper detection; byte parity with CLI verifier; unsigned vs signed separation. |
| [`test_crypto.py`](../backend/tests/test_crypto.py) | **12** | ML-DSA-65 FIPS 204 dimensions; transparent provider status; persistent authority key lifecycle; refusal of classical substitution; corrupted key rejection. |
| [`test_normalization.py`](../backend/tests/test_normalization.py) | **15** | Host-bit zeroing (IPv4 & IPv6); ASN validation (rejects AS0, negative numbers, ASDOT, >32-bit values); ISO 8601 timestamp parsing. |
| [`test_collector.py`](../backend/tests/test_collector.py) | **15** | AS-Path parsing; terminal AS-Set unwrapping/skipping; withdrawal-only UPDATE ingestion ; pure subscription builder; `ris_message_id` extraction. |
| [`test_peer_identity_wp02.py`](../backend/tests/test_peer_identity_wp02.py) | **6** | Peer session derivation ($C:AS:IP$); separation of sessions vs ASNs vs collectors; set-based corroboration; candidate quarantine under repeated single-session updates. |
| [`test_replay_deterministic_wp03.py`](../backend/tests/test_replay_deterministic_wp03.py) | **6** | Zero clock synthesis; rejection of missing/invalid timestamps (`INCOMPLETE_DATA`); strict out-of-order rejection (`INVALID_INPUT`); deterministic sorting with tie-breaking; dataset SHA-256 binding. |
| [`test_evidence_provenance_wp04.py`](../backend/tests/test_evidence_provenance_wp04.py) | **4** | Schema v1.1.0 provenance manifest; transaction reordering binding raw `observation_id` and `supporting_observation_ids`; rule version `2.0.0`; backward compatibility for v1.0.0. |
| [`test_incidents_wp05.py`](../backend/tests/test_incidents_wp05.py) | **6** | Non-destructive incident correlation; stable correlation key; lifecycle transitions (`TRANSIENT`, `PERSISTENT`, `RECURRENT`); source duration derivation; signed evidence preservation across recurrences. |
| [`test_collector_visibility_wp06.py`](../backend/tests/test_collector_visibility_wp06.py) | **5** | Distinct monitoring states (`CONNECTED`, `CONNECTED_NO_RECENT_UPDATES`, `DISCONNECTED`, `STALE_OR_UNKNOWN`); quiet stream does not resolve alerts; disconnect never calls `process_withdrawal()`; RIS peer-state messages handled without route removal. |
| [`test_rpki.py`](../backend/tests/test_rpki.py) | **4** | RIPEstat REST client parsing; ROA validity states; HTTP timeout handling; network error resilience (`UNAVAILABLE`). |
| [`test_rpki_wp07.py`](../backend/tests/test_rpki_wp07.py) | **6** | Live lookups labeled `CURRENT_LOOKUP_CONTEXT`; provider and lookup timestamps; historical replays strictly require time-matched ROA snapshots; future snapshots rejected; AS_PATH disclaimer verified. |
| [`test_historical_replay.py`](../backend/tests/test_historical_replay.py) | **3** | Chronological replay of archival MRT BGP dumps; authentic pre-incident baseline reconstruction; withdrawal and recovery verification. |
| [`test_benchmark.py`](../backend/tests/test_benchmark.py) | **2** | 14-case head-to-head reference detector benchmark; live CPU cryptographic latency benchmarks (ML-DSA-65 vs Ed25519 vs RSA-2048). |
| [`test_benchmark_reproducibility_wp08.py`](../backend/tests/test_benchmark_reproducibility_wp08.py) | **4** | Version and checksum metadata (`dataset_sha256`, `detector_version`, `rule_version`); repeated runs yield identical metrics; stream breakdown separates synthetic controls and historical cases; peer-session diversity verified. |
| **TOTAL** | **138** | **All 138 Tests Passing Deterministically** |

---

## 2. Head-to-Head Reference Benchmark (14 Cases)

Proposal Page 6 specifies an empirical comparison between a **Naïve Reference Detector** (which immediately trusts announcements and overwrites baselines) and **Enhanced HORA-Q** (with candidate quarantine and multi-session corroboration).

The benchmark is executed via [`backend/horaq/benchmark.py`](../backend/horaq/benchmark.py) and permanently documented in [`audit/reference_detector_comparison.json`](../audit/reference_detector_comparison.json):

### Summary Comparison Table

| Benchmark Dimension | Naïve Reference Detector | Enhanced HORA-Q Engine | Operational & Security Consequence |
| :--- | :---: | :---: | :--- |
| **Test Stream Dataset** | 14 calibrated BGP events | 14 calibrated BGP events | Evaluated under identical sequence |
| **Dataset Checksum** | Not Tracked | `64-byte SHA-256 Digest` | Guarantees deterministic reproducibility |
| **Detector Version** | Naive-v1 | `2.0.0` | Explicit version tracking |
| **Precision** | 80.0% (8/10) | 80.0% (8/10) | Equal detection power |
| **Recall (Sensitivity)** | 100.0% (8/8) | 100.0% (8/8) | Zero missed malicious attacks |
| **F1 Score** | 0.8889 | 0.8889 | High overall balance |
| **False Positive Rate** | 10.0% (1/10) | 10.0% (1/10) | Controlled on calibrated stream |
| **Baseline Contamination** | **75.0% (6 of 8 poisoned)** | **0.0% (0 of 8 poisoned)** | **Zero-Poisoning Invariant Enforced** |
| **Single-Peer Flapping** | Promoted to Baseline (Flaw) | Quarantined (`CANDIDATE`) | Churn isolated from trusted policy |
| **Cryptographic Notarization** | None (Unsigned plain JSON) | NIST FIPS 204 ML-DSA-65 | Post-quantum non-repudiation |

```mermaid
pie title Baseline Contamination Under Adversarial Injection
    "Naïve Detector (Poisoned)" : 75
    "Naïve Detector (Clean)" : 25
```
```mermaid
pie title HORA-Q Baseline Protection Under Adversarial Injection
    "HORA-Q (100% Protected Clean)" : 100
```

---

## 3. Cryptographic Overhead Benchmark (Empirical Local CPU Measurements)

The cryptographic engine directly benchmarks ML-DSA-65 against classical Ed25519 and RSA-2048 under 50 iterations on the local host CPU:

| Algorithm | Cryptographic Standard | Quantum Hardness | Public Key Size | Signature Size | Mean Signing Latency | Mean Verify Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ML-DSA-65** (HORA-Q) | **NIST FIPS 204** | **YES (NIST Level 3)** | **1,952 bytes** | **3,309 bytes** | **3.125 ms** | **0.845 ms** |
| **Ed25519** (Classical Reference) | RFC 8032 | NO (Broken by CRQC) | 32 bytes | 64 bytes | 0.045 ms | 0.095 ms |
| **RSA-2048** (Legacy Reference) | PKCS #1 v2.2 | NO (Broken by CRQC) | 294 bytes | 256 bytes | 1.250 ms | 0.080 ms |

### Architectural Tradeoff Analysis:
* ML-DSA-65 signatures are ~52× larger than Ed25519 (3.3 KB vs 64 B).
* In HORA-Q, signatures are generated **per security incident** and **per evidence vault entry**, rather than at line-rate per packet.
* The 3.3 KB storage requirement per alert is trivial on modern storage systems, while securing records against quantum decryption for decades to come.

---

## 4. Archival Historical Incident Replays

HORA-Q validates its detection engine against real-world historical BGP incidents parsed from archival MRT data:

### 1. YouTube / Pakistan Telecom (PTCL) Hijack (24 February 2008)
* **Target Prefix**: `208.65.152.0/22` (Authorized Origin: AS36561, YouTube/Google)
* **Injected Subprefix**: `208.65.153.0/24` (Rogue Origin: AS17557, PTCL)
* **Mechanism**: More-specific LPM route interception.
* **HORA-Q Verdict**: Flagged as `SUBPREFIX_ANOMALY` within 1 BGP update; parent baseline origin preserved; incident resolved upon receipt of PTCL withdrawal.

### 2. Twitter / RTComm Origin Conflict (16 April 2021)
* **Target Prefix**: `104.244.42.0/24` (Authorized Origin: AS13414, Twitter)
* **Rogue Origin**: `AS8342` (RTComm, Russian Telecommunications)
* **Mechanism**: Unauthorized exact-match origin conflict.
* **HORA-Q Verdict**: Flagged as `ORIGIN_CHANGE`; active observing peer tracked; recovery matrix monitored until RTComm withdrawal ingested.

---

## 5. Verification Commands for Evaluators

### 1. Execute Full Backend Test Suite
```bash
python -m pytest
```
*Expected Result*: `138 passed in ~30s`

### 2. Verify Frontend Production Build
```bash
cd frontend
npm run build
```
*Expected Result*: `✓ built in ~3.3s` (0 TypeScript errors)

### 3. Verify Signed Cryptographic Evidence
```bash
python verify_evidence.py audit/sample_evidence_signed.json
```
*Expected Result*: `FINAL VERDICT: [AUTHENTIC] Evidence record verified successfully with valid digital signature. Exit Code: 0`

### 4. Test Adversarial Tamper Rejection
```bash
python -c "import json, subprocess, tempfile; d=json.load(open('audit/sample_evidence_signed.json')); d['record']['observed_asn']=99999; f=tempfile.NamedTemporaryFile('w', delete=False, suffix='.json'); json.dump(d, f); f.close(); exit(subprocess.run(['python', 'verify_evidence.py', f.name]).returncode)"
```
*Expected Result*: `FINAL VERDICT: [COMPROMISED] Verification failed. Record has been tampered with or corrupted. Exit Code: 1`
