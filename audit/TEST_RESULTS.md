# HORA-Q — Test Results & Empirical Verification Log

**Project**: HORA Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  
**Execution Timestamp**: 2026-10-21 11:32:52 UTC  
**Environment**: Windows 11, Python 3.13.7, pytest 9.1.1, Node.js v20.x, Vite 5.4.21  

---

## 1. Backend Pytest Execution

### Exact Command Executed
```powershell
d:\HORA-Q\backend\.venv\Scripts\pytest.exe -v
```

### Complete Test Results Output (36 Tests)
```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.7.0 -- d:\HORA-Q\backend\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: D:\HORA-Q\backend
plugins: anyio-4.15.1, asyncio-1.4.0
asyncio: mode=Mode.STRICT, debug=False

tests/test_api.py::test_root_health PASSED                               [  2%]
tests/test_api.py::test_overview_endpoint PASSED                         [  5%]
tests/test_api.py::test_post_observation_valid PASSED                    [  8%]
tests/test_api.py::test_post_observation_invalid_prefix PASSED           [ 11%]
tests/test_api.py::test_post_observation_invalid_asn PASSED              [ 13%]
tests/test_api.py::test_run_synthetic_scenarios PASSED                   [ 16%]
tests/test_api.py::test_evidence_verify_hash_endpoint PASSED             [ 19%]
tests/test_crypto.py::test_crypto_status_reporting PASSED                [ 22%]
tests/test_crypto.py::test_crypto_behavior PASSED                        [ 25%]
tests/test_detection.py::test_baseline_seeding_creates_no_alert PASSED   [ 27%]
tests/test_detection.py::test_same_origin_updates_observation_count PASSED [ 30%]
tests/test_detection.py::test_origin_change_generates_alert_and_preserves_baseline PASSED [ 33%]
tests/test_detection.py::test_subprefix_anomaly_detection PASSED         [ 36%]
tests/test_detection.py::test_ipv6_subprefix_anomaly_detection PASSED    [ 38%]
tests/test_evidence.py::test_canonicalize_json_sorted_keys PASSED        [ 41%]
tests/test_evidence.py::test_create_and_verify_evidence_hash PASSED      [ 44%]
tests/test_evidence.py::test_verify_evidence_hash_detects_tampering PASSED [ 47%]
tests/test_normalization.py::test_normalize_prefix_ipv4_valid PASSED     [ 50%]
tests/test_normalization.py::test_normalize_prefix_host_bit_normalization PASSED [ 52%]
tests/test_normalization.py::test_normalize_prefix_ipv6_valid PASSED     [ 55%]
tests/test_normalization.py::test_normalize_prefix_whitespace PASSED     [ 58%]
tests/test_normalization.py::test_normalize_prefix_invalid_missing_mask PASSED [ 61%]
tests/test_normalization.py::test_normalize_prefix_invalid_characters PASSED [ 63%]
tests/test_normalization.py::test_normalize_asn_integer PASSED           [ 66%]
tests/test_normalization.py::test_normalize_asn_string PASSED            [ 69%]
tests/test_normalization.py::test_normalize_asn_as0_rejected PASSED      [ 72%]
tests/test_normalization.py::test_normalize_asn_negative_rejected PASSED [ 75%]
tests/test_normalization.py::test_normalize_asn_out_of_range PASSED      [ 77%]
tests/test_normalization.py::test_normalize_asn_asdot_rejected PASSED    [ 80%]
tests/test_normalization.py::test_normalize_timestamp_default PASSED     [ 83%]
tests/test_normalization.py::test_normalize_timestamp_iso PASSED         [ 86%]
tests/test_normalization.py::test_normalize_timestamp_invalid PASSED     [ 88%]
tests/test_rpki.py::test_rpki_valid_response PASSED                      [ 91%]
tests/test_rpki.py::test_rpki_invalid_response PASSED                    [ 94%]
tests/test_rpki.py::test_rpki_timeout_yields_unavailable PASSED          [ 97%]
tests/test_rpki.py::test_rpki_http_error_yields_unavailable PASSED       [100%]

======================= 36 passed, 3 warnings in 1.75s ========================
```

---

## 2. Frontend Production Build & Type Checking

### Exact Command Executed
```powershell
npm run build
```

### Build Log Output
```text
> horaq-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1961 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.12 kB │ gzip:  0.61 kB
dist/assets/index-DMUFQoR5.css   23.64 kB │ gzip:  5.32 kB
dist/assets/index-2wzZdYOZ.js   241.99 kB │ gzip: 66.58 kB
✓ built in 3.01s
```

---

## 3. Test Statistics Summary
- **Total Tests Collected**: 36
- **Tests Passed**: 36 (100.0%)
- **Tests Failed**: 0 (0.0%)
- **Tests Skipped**: 0 (0.0%)
- **Total Test Execution Duration**: 1.75 seconds
- **Production Build Diagnostics / Lint Errors**: 0
