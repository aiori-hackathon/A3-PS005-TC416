# HORA-Q — Security & Cryptographic Review

**Project**: HORA Q (Explainable BGP Origin and Subprefix Anomaly Monitor)  
**Hackathon**: AIORI-3 | Track 2 Cyber Security (Problem PS-005, Team A3-PS005-TC416)  

---

## 1. Security Posture Overview

HORA Q was reviewed against standard OWASP and cryptographic assurance baselines. As an autonomous BGP monitoring and evidence notarization system, primary security concerns center on:
1. **Input Sanitization & Injection Defense**: Preventing malicious CIDRs or malformed ASNs from corrupting routing memory or database queries.
2. **Cryptographic Integrity & Non-Repudiation**: Ensuring evidence records cannot be forged, manipulated, or silently substituted.
3. **Secret & Key Management**: Prohibiting hardcoded private keys or credential leakage.

---

## 2. Threat Analysis & Mitigations

### Threat 1: Baseline Poisoning via Malicious Route Announcement
- **Threat Scenario**: An attacker announces a forged origin or hijacked subprefix, hoping the system will automatically accept the rogue announcement as the new legitimate baseline.
- **Implemented Mitigation**: [`horaq/detection.py`](file:///d:/HORA-Q/backend/horaq/detection.py#L145-L165) strictly isolates detection from baseline updates. When an origin change is observed, an alert is recorded, but the baseline table remains unchanged. Baselines can only be promoted through explicit operator review.
- **Verification Evidence**: Verified by [`tests/test_detection.py::test_origin_change_generates_alert_and_preserves_baseline`](file:///d:/HORA-Q/backend/tests/test_detection.py).

### Threat 2: SQL Injection & ORM Escapes
- **Threat Scenario**: Malicious strings injected in `prefix`, `observed_asn`, or `collector` parameters aimed at manipulating SQLite tables.
- **Implemented Mitigation**:
  - All input parameters are strictly parsed using Python's standard `ipaddress.ip_network()` and strict integer conversion in [`horaq/normalization.py`](file:///d:/HORA-Q/backend/horaq/normalization.py).
  - All database interactions in [`horaq/database.py`](file:///d:/HORA-Q/backend/horaq/database.py) and [`horaq/detection.py`](file:///d:/HORA-Q/backend/horaq/detection.py) use parameterized queries (`?` place-holders) with zero raw string concatenation.
- **Verification Evidence**: Passing tests in [`tests/test_normalization.py`](file:///d:/HORA-Q/backend/tests/test_normalization.py) reject malformed strings with explicit HTTP 422 errors.

### Threat 3: Canonical Serialization Ambiguity (RFC 8785)
- **Threat Scenario**: Inconsistent JSON whitespace, floating point representations, or un-sorted keys allow an attacker to claim a modified record produced the same digest.
- **Implemented Mitigation**: [`horaq/evidence.py`](file:///d:/HORA-Q/backend/horaq/evidence.py#L11-L22) strictly enforces RFC 8785 JSON Canonicalization Scheme (JCS):
  - Compact separators: `(',', ':')` (zero whitespace after delimiters).
  - Strict recursive key sorting: `sort_keys=True`.
  - UTF-8 binary encoding.
- **Verification Evidence**: [`tests/test_evidence.py::test_canonicalize_json_sorted_keys`](file:///d:/HORA-Q/backend/tests/test_evidence.py).

### Threat 4: Silent Cryptographic Substitution & False Claims
- **Threat Scenario**: A system falsely claims post-quantum security while silently falling back to classical RSA-1024 or generating dummy signature strings.
- **Implemented Mitigation**: [`horaq/crypto.py`](file:///d:/HORA-Q/backend/horaq/crypto.py#L44-L60) explicitly checks for the Open Quantum Safe library (`liboqs`). If unavailable, it transparently reports `status: "PROVIDER_UNAVAILABLE"` and `signer_status: "UNSIGNED"`. It strictly refuses to fabricate signatures or substitute classical keys.
- **Verification Evidence**: [`tests/test_crypto.py::test_crypto_status_reporting`](file:///d:/HORA-Q/backend/tests/test_crypto.py).

---

## 3. Secret & Credential Audit
- **Repository Scan**: Zero hardcoded passwords, private keys, or API tokens were found in the codebase.
- **Environment Variables**: Managed cleanly via [`horaq/config.py`](file:///d:/HORA-Q/backend/horaq/config.py) using Pydantic Settings with safe local defaults.
