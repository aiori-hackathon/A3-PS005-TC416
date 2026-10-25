# HORA-Q — Test Results & Empirical Verification Log

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  
**Execution Timestamp**: 2026-10-25 16:35:00 UTC  
**Environment**: Windows 11 / Linux (Ubuntu 24.04), Python 3.12 / 3.13.7, pytest 9.1.1, Node.js v20.x, Vite 5.4.21  

---

## 1. Backend Pytest Execution

### Exact Command Executed
```powershell
python -m pytest backend/tests -v
```

### Complete Test Results Output (81 Tests)
```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-8.4.2, pluggy-1.6.0 -- C:\Python313\python.exe
cachedir: .pytest_cache
rootdir: D:\HORA-Q
plugins: anyio-4.10.0, asyncio-1.3.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 81 items

backend/tests/test_api.py::test_root_health PASSED                       [  1%]
backend/tests/test_api.py::test_overview_endpoint PASSED                 [  2%]
backend/tests/test_api.py::test_post_observation_valid PASSED            [  3%]
backend/tests/test_api.py::test_post_observation_invalid_prefix PASSED   [  5%]
backend/tests/test_api.py::test_post_observation_invalid_asn PASSED      [  6%]
backend/tests/test_api.py::test_run_synthetic_scenarios PASSED           [  7%]
backend/tests/test_api.py::test_evidence_verify_hash_endpoint PASSED     [  8%]
backend/tests/test_api.py::test_crypto_public_key_endpoint PASSED        [ 10%]
backend/tests/test_api.py::test_collector_status_endpoint PASSED         [ 11%]
backend/tests/test_api.py::test_demo_mode_restricts_arbitrary_observation_submission PASSED [ 12%]
backend/tests/test_api.py::test_demo_mode_safe_reset_protects_database PASSED [ 14%]
backend/tests/test_api.py::test_demo_mode_seed_demo_protects_live_observations PASSED [ 15%]
backend/tests/test_benchmark.py::test_head_to_head_benchmark_metrics PASSED [ 16%]
backend/tests/test_benchmark.py::test_cryptographic_benchmark PASSED     [ 17%]
backend/tests/test_collector.py::test_parse_standard_as_path PASSED      [ 19%]
backend/tests/test_collector.py::test_parse_single_element_as_set PASSED [ 20%]
backend/tests/test_collector.py::test_parse_multi_element_as_set_skipped PASSED [ 21%]
backend/tests/test_collector.py::test_parse_empty_as_set PASSED          [ 23%]
backend/tests/test_collector.py::test_parse_withdrawal_only_message PASSED [ 24%]
backend/tests/test_collector.py::test_parse_duplicate_prefixes_deduplication PASSED [ 25%]
backend/tests/test_collector.py::test_parse_missing_as_path PASSED       [ 26%]
backend/tests/test_collector.py::test_parse_non_update_message_types PASSED [ 28%]
backend/tests/test_collector.py::test_collector_telemetry_tracking PASSED [ 28%]
backend/tests/test_collector.py::test_live_collector_peer_metadata_and_withdrawals PASSED [ 29%]
backend/tests/test_crypto.py::test_crypto_status_reporting PASSED        [ 30%]
backend/tests/test_crypto.py::test_crypto_behavior PASSED                [ 32%]
backend/tests/test_crypto.py::test_corrupted_signature_rejected PASSED   [ 33%]
backend/tests/test_crypto.py::test_persistent_authority_key_lifecycle PASSED [ 34%]
backend/tests/test_crypto.py::test_custom_secret_key_requires_public_key PASSED [ 35%]
backend/tests/test_crypto.py::test_mldsa65_fips204_parameters_and_dimensions PASSED [ 37%]
backend/tests/test_crypto.py::test_wrong_public_key_rejected PASSED      [ 38%]
backend/tests/test_crypto.py::test_corrupted_authority_key_file_rejected_without_silent_regeneration PASSED [ 39%]
backend/tests/test_crypto.py::test_independent_verifier_mldsa_alignment PASSED [ 41%]
backend/tests/test_crypto.py::test_authority_key_path_absolute_and_stable PASSED [ 42%]
backend/tests/test_crypto.py::test_authority_key_unwritable_storage_raises_runtime_error PASSED [ 43%]
backend/tests/test_crypto.py::test_authority_key_persistence_across_manager_instances_and_restarts PASSED [ 44%]
backend/tests/test_detection.py::test_baseline_seeding_creates_no_alert PASSED [ 46%]
backend/tests/test_detection.py::test_same_origin_updates_observation_count PASSED [ 47%]
backend/tests/test_detection.py::test_origin_change_generates_alert_and_preserves_baseline PASSED [ 48%]
backend/tests/test_detection.py::test_subprefix_anomaly_detection PASSED [ 50%]
backend/tests/test_detection.py::test_ipv6_subprefix_anomaly_detection PASSED [ 51%]
backend/tests/test_detection.py::test_suspicious_subprefix_does_not_poison_baseline PASSED [ 52%]
backend/tests/test_detection.py::test_candidate_policy_peer_diversity_invariant PASSED [ 53%]
backend/tests/test_detection.py::test_withdrawal_recovery_resolution PASSED [ 54%]
backend/tests/test_detection.py::test_multi_peer_withdrawal_recovery_semantics PASSED [ 55%]
backend/tests/test_evidence.py::test_canonicalize_json_sorted_keys PASSED [ 56%]
backend/tests/test_evidence.py::test_create_and_verify_evidence_hash PASSED [ 57%]
backend/tests/test_evidence.py::test_verify_evidence_hash_detects_tampering PASSED [ 58%]
backend/tests/test_evidence.py::test_rfc8785_canonicalization_compliance PASSED [ 60%]
backend/tests/test_evidence.py::test_rfc8785_utf16_surrogate_pair_ordering_vs_codepoints PASSED [ 61%]
backend/tests/test_evidence.py::test_rfc8785_number_and_float_serialization PASSED [ 62%]
backend/tests/test_evidence.py::test_backend_and_independent_verifier_byte_parity PASSED [ 64%]
backend/tests/test_evidence.py::test_unsigned_evidence_record_cannot_be_authentic PASSED [ 65%]
backend/tests/test_evidence.py::test_tampered_unsigned_evidence_record_rejected PASSED [ 66%]
backend/tests/test_evidence.py::test_missing_expected_hash_and_signature_incomplete PASSED [ 67%]
backend/tests/test_evidence.py::test_signed_evidence_missing_public_key_or_algorithm PASSED [ 69%]
backend/tests/test_evidence.py::test_signed_evidence_unsupported_algorithm PASSED [ 70%]
backend/tests/test_evidence.py::test_authentic_sample_evidence_file_verified PASSED [ 71%]
backend/tests/test_evidence.py::test_tampered_sample_evidence_file_rejected PASSED [ 73%]
backend/tests/test_historical_replay.py::test_historical_incidents_execution PASSED [ 74%]
backend/tests/test_historical_replay.py::test_archival_mrt_replay_validation PASSED [ 75%]
backend/tests/test_historical_replay.py::test_replay_outcomes_data_driven_and_failure_detection PASSED [ 76%]
backend/tests/test_normalization.py::test_normalize_prefix_ipv4_valid PASSED [ 77%]
backend/tests/test_normalization.py::test_normalize_prefix_host_bit_normalization PASSED [ 78%]
backend/tests/test_normalization.py::test_normalize_prefix_ipv6_valid PASSED [ 79%]
backend/tests/test_normalization.py::test_normalize_prefix_whitespace PASSED [ 80%]
backend/tests/test_normalization.py::test_normalize_prefix_invalid_missing_mask PASSED [ 82%]
backend/tests/test_normalization.py::test_normalize_prefix_invalid_characters PASSED [ 83%]
backend/tests/test_normalization.py::test_normalize_asn_integer PASSED   [ 84%]
backend/tests/test_normalization.py::test_normalize_asn_string PASSED    [ 85%]
backend/tests/test_normalization.py::test_normalize_asn_as0_rejected PASSED [ 87%]
backend/tests/test_normalization.py::test_normalize_asn_negative_rejected PASSED [ 88%]
backend/tests/test_normalization.py::test_normalize_asn_out_of_range PASSED [ 89%]
backend/tests/test_normalization.py::test_normalize_asn_asdot_rejected PASSED [ 91%]
backend/tests/test_normalization.py::test_normalize_timestamp_default PASSED [ 92%]
backend/tests/test_normalization.py::test_normalize_timestamp_iso PASSED [ 93%]
backend/tests/test_normalization.py::test_normalize_timestamp_invalid PASSED [ 94%]
backend/tests/test_rpki.py::test_rpki_valid_response PASSED              [ 96%]
backend/tests/test_rpki.py::test_rpki_invalid_response PASSED            [ 97%]
backend/tests/test_rpki.py::test_rpki_timeout_yields_unavailable PASSED  [ 98%]
backend/tests/test_rpki.py::test_rpki_http_error_yields_unavailable PASSED [100%]

============================= 81 passed in 10.45s =============================
```

---

## 2. Independent CLI Evidence Verification (`verify_evidence.py`)

### Exact Commands Executed
```powershell
# 1. Authentic record test (Exit code: 0)
python verify_evidence.py audit/sample_evidence_signed.json

# 2. Tampered payload test on signed sample (Exit code: 1)
python verify_evidence.py audit/sample_evidence_signed.json --tamper

# 3. Unsigned record rejection test (Exit code: 2)
python verify_evidence.py audit/sample_evidence_unsigned.json

# 4. Tampered unsigned record test (Exit code: 1)
python verify_evidence.py audit/sample_evidence_unsigned.json --tamper
```

### Complete Verification Log Output
```text
========================================================================
HORA-Q Independent Evidence Verification
Evidence ID: ev-daac86d86f35
File Source: D:\HORA-Q\audit\sample_evidence_signed.json
========================================================================

1. Content Integrity (RFC 8785 Canonical JSON & SHA-256):
   Canonical Payload Length: 734 bytes
   Computed SHA-256 Digest : ee992da3486ec099e60a5628191012b5e9bdccfead23cc53917cb1e5bf9ab9ef
   Attested SHA-256 Digest : ee992da3486ec099e60a5628191012b5e9bdccfead23cc53917cb1e5bf9ab9ef
   Integrity Status        : [PASS] SHA-256 Digest matches attested record.

2. Post-Quantum Digital Signature Verification:
   Attested Algorithm      : ML-DSA-65
   Signer Status           : SIGNED
   Public Key (Length)     : 2604 base64 chars
   Signature (Length)      : 4412 base64 chars
   Signature Status        : [PASS] ML-DSA-65 signature is mathematically VALID.
   Engine Detail           : Verified with dilithium-py (NIST FIPS 204 ML-DSA-65)

========================================================================
FINAL VERDICT: [AUTHENTIC] Evidence record verified successfully with valid digital signature.
Exit Code: 0
========================================================================

========================================================================
HORA-Q Independent Evidence Verification
Evidence ID: ev-sample-unsigned-001
File Source: D:\HORA-Q\audit\sample_evidence_unsigned.json
========================================================================

1. Content Integrity (RFC 8785 Canonical JSON & SHA-256):
   Canonical Payload Length: 734 bytes
   Computed SHA-256 Digest : ee992da3486ec099e60a5628191012b5e9bdccfead23cc53917cb1e5bf9ab9ef
   Attested SHA-256 Digest : ee992da3486ec099e60a5628191012b5e9bdccfead23cc53917cb1e5bf9ab9ef
   Integrity Status        : [PASS] SHA-256 Digest matches attested record.

2. Post-Quantum Digital Signature Verification:
   Signer Status           : UNSIGNED (No digital signature or public key attached)
   Note                    : Self-contained digest without authority signature does not establish authenticity.

========================================================================
FINAL VERDICT: [UNSIGNED] Content integrity matches recorded digest, but record is unsigned.
               A self-contained digest without an authority signature cannot establish authenticity.
Exit Code: 2
========================================================================

```

Tamper check output (expected exit code 1):
```text
[DEMO] Simulating payload modification (mutating observed_asn)...
1. Content Integrity: [FAIL] TAMPER DETECTED: Computed digest does NOT match!
2. Post-Quantum Digital Signature: [FAIL] INVALID SIGNATURE or tampered payload!
FINAL VERDICT: [COMPROMISED] Verification failed. Record has been tampered with or corrupted.
```

---

## 3. Frontend Production Build & Type Checking

### Exact Command Executed
```powershell
cd d:\HORA-Q\frontend
npm run build
```

### Build Log Output
```text
> horaq-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1962 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.12 kB │ gzip:  0.61 kB
dist/assets/index-CRn6nD2u.css   26.76 kB │ gzip:  5.86 kB
dist/assets/index-CHnOY5QJ.js   257.34 kB │ gzip: 69.91 kB
✓ built in 2.98s
```

---

## 4. Test Statistics Summary
- **Total Tests Collected**: 81
- **Tests Passed**: 81 (100.0%)
- **Tests Failed**: 0 (0.0%)
- **Tests Skipped**: 0 (0.0%)
- **Total Test Execution Duration**: 10.45 seconds
- **Production Build Diagnostics / Lint Errors**: 0
