# HORA-Q — Test Results & Empirical Verification Log

**Project**: HORA-Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  
**Execution Timestamp**: 2026-10-24 10:23:30 UTC  
**Environment**: Windows 11 / Linux (Ubuntu 24.04), Python 3.12 / 3.13.7, pytest 9.1.1, Node.js v20.x, Vite 5.4.21  

---

## 1. Backend Pytest Execution

### Exact Command Executed
```powershell
d:\HORA-Q\backend\.venv\Scripts\python.exe -m pytest -v
```

### Complete Test Results Output (42 Tests)
```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.7.0 -- D:\HORA-Q\backend\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: D:\HORA-Q\backend
plugins: anyio-4.15.1, asyncio-1.4.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 42 items

tests/test_api.py::test_root_health PASSED                               [  2%]
tests/test_api.py::test_overview_endpoint PASSED                         [  4%]
tests/test_api.py::test_post_observation_valid PASSED                    [  7%]
tests/test_api.py::test_post_observation_invalid_prefix PASSED           [  9%]
tests/test_api.py::test_post_observation_invalid_asn PASSED              [ 11%]
tests/test_api.py::test_run_synthetic_scenarios PASSED                   [ 14%]
tests/test_api.py::test_evidence_verify_hash_endpoint PASSED             [ 16%]
tests/test_api.py::test_crypto_public_key_endpoint PASSED                [ 19%]
tests/test_crypto.py::test_crypto_status_reporting PASSED                [ 21%]
tests/test_crypto.py::test_crypto_behavior PASSED                        [ 23%]
tests/test_crypto.py::test_corrupted_signature_rejected PASSED           [ 26%]
tests/test_crypto.py::test_persistent_authority_key_lifecycle PASSED     [ 28%]
tests/test_crypto.py::test_custom_secret_key_requires_public_key PASSED  [ 30%]
tests/test_detection.py::test_baseline_seeding_creates_no_alert PASSED   [ 33%]
tests/test_detection.py::test_same_origin_updates_observation_count PASSED [ 35%]
tests/test_detection.py::test_origin_change_generates_alert_and_preserves_baseline PASSED [ 38%]
tests/test_detection.py::test_subprefix_anomaly_detection PASSED         [ 40%]
tests/test_detection.py::test_ipv6_subprefix_anomaly_detection PASSED    [ 42%]
tests/test_detection.py::test_suspicious_subprefix_does_not_poison_baseline PASSED [ 45%]
tests/test_evidence.py::test_canonicalize_json_sorted_keys PASSED        [ 47%]
tests/test_evidence.py::test_create_and_verify_evidence_hash PASSED      [ 50%]
tests/test_evidence.py::test_verify_evidence_hash_detects_tampering PASSED [ 52%]
tests/test_evidence.py::test_rfc8785_canonicalization_compliance PASSED  [ 54%]
tests/test_normalization.py::test_normalize_prefix_ipv4_valid PASSED     [ 57%]
tests/test_normalization.py::test_normalize_prefix_host_bit_normalization PASSED [ 59%]
tests/test_normalization.py::test_normalize_prefix_ipv6_valid PASSED     [ 61%]
tests/test_normalization.py::test_normalize_prefix_whitespace PASSED     [ 64%]
tests/test_normalization.py::test_normalize_prefix_invalid_missing_mask PASSED [ 66%]
tests/test_normalization.py::test_normalize_prefix_invalid_characters PASSED [ 69%]
tests/test_normalization.py::test_normalize_asn_integer PASSED           [ 71%]
tests/test_normalization.py::test_normalize_asn_string PASSED            [ 73%]
tests/test_normalization.py::test_normalize_asn_as0_rejected PASSED      [ 76%]
tests/test_normalization.py::test_normalize_asn_negative_rejected PASSED [ 78%]
tests/test_normalization.py::test_normalize_asn_out_of_range PASSED      [ 80%]
tests/test_normalization.py::test_normalize_asn_asdot_rejected PASSED    [ 83%]
tests/test_normalization.py::test_normalize_timestamp_default PASSED     [ 85%]
tests/test_normalization.py::test_normalize_timestamp_iso PASSED         [ 88%]
tests/test_normalization.py::test_normalize_timestamp_invalid PASSED     [ 90%]
tests/test_rpki.py::test_rpki_valid_response PASSED                      [ 92%]
tests/test_rpki.py::test_rpki_invalid_response PASSED                    [ 95%]
tests/test_rpki.py::test_rpki_timeout_yields_unavailable PASSED          [ 97%]
tests/test_rpki.py::test_rpki_http_error_yields_unavailable PASSED       [100%]

======================= 42 passed, 3 warnings in 3.29s ========================
```

---

## 2. Independent CLI Evidence Verification (`verify_evidence.py`)

### Exact Commands Executed
```powershell
# 1. Authentic record test
python verify_evidence.py audit/sample_evidence_signed.json

# 2. Tampered payload test
python verify_evidence.py audit/sample_evidence_signed.json --tamper
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

2. Post-Quantum Digital Signature (ML-DSA-65 / FIPS 204):
   Signer Status           : SIGNED
   Public Key (Length)     : 2604 base64 chars
   Signature (Length)      : 4392 base64 chars
   Signature Status        : [PASS] ML-DSA-65 signature is mathematically VALID.
   Engine Detail           : Verified with dilithium-py (FIPS 204 ML-DSA-65 / Dilithium3)

========================================================================
FINAL VERDICT: [AUTHENTIC] Evidence record verified successfully.
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
dist/assets/index-CpQIKgCI.css   26.58 kB │ gzip:  5.82 kB
dist/assets/index-DDJBhBAU.js   255.60 kB │ gzip: 69.49 kB
✓ built in 3.47s
```

---

## 4. Test Statistics Summary
- **Total Tests Collected**: 42
- **Tests Passed**: 42 (100.0%)
- **Tests Failed**: 0 (0.0%)
- **Tests Skipped**: 0 (0.0%)
- **Total Test Execution Duration**: 3.29 seconds
- **Production Build Diagnostics / Lint Errors**: 0
