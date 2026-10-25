#!/usr/bin/env python3
"""HORA-Q Independent Evidence Verifier (CLI).

Provides an independent verification path outside the browser:
- Validates canonical RFC 8785 JSON serialization.
- Recalculates SHA-256 digest and compares with stored/attested hash.
- Verifies ML-DSA-65 post-quantum digital signature if present.
- Verifies both authentic and tampered records, returning appropriate exit codes.
"""

import argparse
import base64
import importlib
import json
import os
import sys
from typing import Any, Dict, Tuple

# Automatically detect local backend virtualenv if run from system Python
_venv_site = os.path.join(os.path.dirname(__file__), "backend", ".venv", "Lib", "site-packages")
if os.path.exists(_venv_site) and _venv_site not in sys.path:
    sys.path.insert(0, _venv_site)


def canonicalize_json(data: Any) -> bytes:
    """RFC 8785 Canonical JSON Serialization (JCS).

    Deterministic lexicographical UTF-16 code unit key sorting, compact delimiters,
    and standardized IEEE 754 number representation.
    Requires the conformant 'rfc8785' package.
    """
    try:
        import rfc8785
        return rfc8785.dumps(data)
    except ImportError as err:
        print("[!] Error: 'rfc8785' package is required for RFC 8785 canonicalization.", file=sys.stderr)
        print("    Install it via: pip install rfc8785>=0.1.4", file=sys.stderr)
        raise err


def compute_sha256(canon_bytes: bytes) -> str:
    """Compute SHA-256 hex digest over canonical bytes."""
    import hashlib
    return hashlib.sha256(canon_bytes).hexdigest()


def verify_mldsa_signature(
    data_bytes: bytes,
    signature_b64: str,
    public_key_b64: str,
    algorithm: str = "ML-DSA-65",
) -> Tuple[bool, str]:
    """Verify digital signature matching the attested algorithm without conflation."""
    try:
        sig_bytes = base64.b64decode(signature_b64)
        pub_bytes = base64.b64decode(public_key_b64)
    except Exception as err:
        return False, f"Malformed base64: {err}"

    algo_norm = algorithm.strip().upper()

    if algo_norm == "ML-DSA-65":
        # 1. Native standardized NIST FIPS 204 ML-DSA-65
        try:
            from dilithium_py.ml_dsa import ML_DSA_65
            valid = ML_DSA_65.verify(pub_bytes, data_bytes, sig_bytes)
            if valid:
                return True, "Verified with dilithium-py (NIST FIPS 204 ML-DSA-65)"
            else:
                return False, "ML-DSA-65 signature is mathematically INVALID"
        except ImportError:
            pass
        except Exception as e:
            return False, f"ML-DSA-65 verification error: {e}"

        # 2. Try liboqs ML-DSA-65
        try:
            oqs_mod = importlib.import_module("oqs")
            with oqs_mod.Signature("ML-DSA-65") as verifier:
                valid = verifier.verify(data_bytes, sig_bytes, pub_bytes)
                if valid:
                    return True, "Verified with liboqs (NIST FIPS 204 ML-DSA-65)"
                else:
                    return False, "ML-DSA-65 signature is mathematically INVALID"
        except Exception:
            pass

        return False, "ML-DSA-65 provider unavailable; will not substitute incompatible legacy algorithms"

    elif algo_norm in ("DILITHIUM3", "CRYSTALS-DILITHIUM3"):
        # Explicit legacy path for pre-standardization Dilithium3
        try:
            dilithium_mod = importlib.import_module("dilithium_py.dilithium")
            Dilithium3 = getattr(dilithium_mod, "Dilithium3")
            valid = Dilithium3.verify(pub_bytes, data_bytes, sig_bytes)
            if valid:
                return True, "Verified with dilithium-py (CRYSTALS-Dilithium3 pre-standardization)"
            else:
                return False, "CRYSTALS-Dilithium3 signature is mathematically INVALID"
        except ImportError:
            pass
        except Exception as e:
            return False, f"Dilithium3 verification error: {e}"

        return False, "CRYSTALS-Dilithium3 provider unavailable"

    else:
        return False, f"Unsupported algorithm '{algorithm}'"



class VerificationResult(tuple):
    """Tuple containing (verdict, exit_code) with boolean evaluation matching exit_code == 0."""

    def __new__(cls, verdict: str, exit_code: int):
        return super().__new__(cls, (verdict, exit_code))

    @property
    def verdict(self) -> str:
        return self[0]

    @property
    def exit_code(self) -> int:
        return self[1]

    def __bool__(self) -> bool:
        return self.exit_code == 0


def verify_evidence_file(
    file_path: str,
    simulate_tamper: bool = False,
    allow_unsigned: bool = False,
) -> VerificationResult:
    """Load, inspect, and verify an exported evidence JSON file.

    Distinguishes:
    1. Content integrity (SHA-256 vs attested digest).
    2. Digital signature verification (ML-DSA-65 / NIST FIPS 204).
    3. Authenticity verdict:
       - [AUTHENTIC] (exit 0): Valid digital signature and intact payload.
       - [COMPROMISED] (exit 1): Tamper detected, digest mismatch, or invalid signature.
       - [INCOMPLETE] (exit 1): Missing signature and missing hash, or incomplete key/signature pair.
       - [UNSUPPORTED] (exit 1): Unrecognized or missing algorithm metadata.
       - [UNSIGNED] (exit 2 default, exit 0 with --allow-unsigned): Valid digest but unsigned.
         A self-contained digest without an authority signature cannot establish authenticity.
    """
    if not os.path.exists(file_path):
        print(f"[!] File not found: {file_path}", file=sys.stderr)
        return VerificationResult("NOT_FOUND", 1)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as err:
        print(f"[!] Failed to parse JSON file {file_path}: {err}", file=sys.stderr)
        return VerificationResult("INVALID_JSON", 1)

    # Detect structure: direct evidence record or wrapped API response
    if "record" in data and isinstance(data["record"], dict):
        record = data["record"]
        expected_hash = data.get("record_hash") or data.get("hash") or data.get("content_hash")
        signature = data.get("signature")
        public_key = data.get("public_key")
        evidence_id = data.get("id") or data.get("evidence_id") or "UNKNOWN"
        signer_status = data.get("signer_status") or ("SIGNED" if signature else "UNSIGNED")
    else:
        record = data
        expected_hash = data.get("record_hash") or data.get("content_hash") or data.get("sha256_hash") or data.get("hash")
        signature = data.get("signature")
        public_key = data.get("public_key")
        evidence_id = data.get("evidence_id") or "DIRECT_RECORD"
        signer_status = "SIGNED" if signature else "UNSIGNED"

    print("=" * 72)
    print("HORA-Q Independent Evidence Verification")
    print(f"Evidence ID: {evidence_id}")
    print(f"File Source: {os.path.abspath(file_path)}")
    print("=" * 72)

    if simulate_tamper:
        print("[DEMO] Simulating payload modification (mutating observed_asn)...")
        record = dict(record)
        record["observed_asn"] = "AS99999_TAMPERED"

    # Step 1: Content Integrity (Canonicalization + SHA-256)
    try:
        canon_bytes = canonicalize_json(record)
        computed_hash = compute_sha256(canon_bytes)
    except Exception as err:
        print(f"\n[!] Canonicalization or hashing error: {err}", file=sys.stderr)
        return VerificationResult("CANONICALIZATION_ERROR", 1)

    print(f"\n1. Content Integrity (RFC 8785 Canonical JSON & SHA-256):")
    print(f"   Canonical Payload Length: {len(canon_bytes)} bytes")
    print(f"   Computed SHA-256 Digest : {computed_hash}")

    if expected_hash and str(expected_hash).strip():
        expected_hash_str = str(expected_hash).strip()
        print(f"   Attested SHA-256 Digest : {expected_hash_str}")
        if computed_hash.lower() == expected_hash_str.lower():
            integrity_status = "PASS"
            print("   Integrity Status        : [PASS] SHA-256 Digest matches attested record.")
        else:
            integrity_status = "FAIL"
            print("   Integrity Status        : [FAIL] TAMPER DETECTED: Computed digest does NOT match!")
    else:
        integrity_status = "MISSING"
        print("   Integrity Status        : [MISSING] No attested comparison digest present in file.")

    # Step 2: Post-Quantum Digital Signature Verification
    algorithm = data.get("algorithm")
    print(f"\n2. Post-Quantum Digital Signature Verification:")

    if signature and public_key:
        if not algorithm or not str(algorithm).strip():
            sig_status = "INCOMPLETE"
            sig_msg = "Signed record is missing required 'algorithm' metadata specification"
            print(f"   Signature Status        : [FAIL] Missing required algorithm metadata.")
            print(f"   Engine Detail           : {sig_msg}")
        else:
            algo_str = str(algorithm).strip()
            print(f"   Attested Algorithm      : {algo_str}")
            print(f"   Signer Status           : {signer_status}")
            print(f"   Public Key (Length)     : {len(public_key)} base64 chars")
            print(f"   Signature (Length)      : {len(signature)} base64 chars")
            valid_sig, msg = verify_mldsa_signature(canon_bytes, signature, public_key, algorithm=algo_str)
            if valid_sig:
                sig_status = "PASS"
                sig_msg = msg
                print(f"   Signature Status        : [PASS] {algo_str} signature is mathematically VALID.")
                print(f"   Engine Detail           : {msg}")
            else:
                if "Unsupported algorithm" in msg or "unavailable" in msg:
                    sig_status = "UNSUPPORTED"
                else:
                    sig_status = "FAIL"
                sig_msg = msg
                print(f"   Signature Status        : [FAIL] Signature verification rejected!")
                print(f"   Engine Detail           : {msg}")
    elif signature and not public_key:
        sig_status = "INCOMPLETE"
        sig_msg = "Signature attached but public key is missing"
        print(f"   Signature Status        : [FAIL] Incomplete cryptographic metadata.")
        print(f"   Engine Detail           : {sig_msg}")
    elif public_key and not signature:
        sig_status = "INCOMPLETE"
        sig_msg = "Public key attached but signature is missing"
        print(f"   Signature Status        : [FAIL] Incomplete cryptographic metadata.")
        print(f"   Engine Detail           : {sig_msg}")
    else:
        sig_status = "UNSIGNED"
        sig_msg = "Record has no digital signature or public key attached"
        print(f"   Signer Status           : UNSIGNED (No digital signature or public key attached)")
        print(f"   Note                    : Self-contained digest without authority signature does not establish authenticity.")

    # Step 3: Determine Authenticity Verdict and Exit Code
    print("\n" + "=" * 72)
    if integrity_status == "FAIL" or sig_status == "FAIL":
        verdict = "COMPROMISED"
        exit_code = 1
        print("FINAL VERDICT: [COMPROMISED] Verification failed. Record has been tampered with or corrupted.")
    elif sig_status == "UNSUPPORTED":
        verdict = "UNSUPPORTED"
        exit_code = 1
        print(f"FINAL VERDICT: [UNSUPPORTED] Cryptographic algorithm unsupported: {sig_msg}")
    elif sig_status == "INCOMPLETE" or (integrity_status == "MISSING" and sig_status == "UNSIGNED"):
        verdict = "INCOMPLETE"
        exit_code = 1
        print("FINAL VERDICT: [INCOMPLETE] Insufficient evidence. Missing required signature or comparison digest.")
    elif sig_status == "UNSIGNED":
        verdict = "UNSIGNED"
        if allow_unsigned:
            exit_code = 0
            print("FINAL VERDICT: [UNSIGNED] (Allowed by flag). Digest verified, but record lacks authority signature.")
        else:
            exit_code = 2
            print("FINAL VERDICT: [UNSIGNED] Content integrity matches recorded digest, but record is unsigned.")
            print("               A self-contained digest without an authority signature cannot establish authenticity.")
    elif sig_status == "PASS" and integrity_status in ("PASS", "MISSING"):
        verdict = "AUTHENTIC"
        exit_code = 0
        print("FINAL VERDICT: [AUTHENTIC] Evidence record verified successfully with valid digital signature.")
    else:
        verdict = "FAILED"
        exit_code = 1
        print("FINAL VERDICT: [FAILED] Verification could not be completed.")

    print(f"Exit Code: {exit_code}")
    print("=" * 72)
    return VerificationResult(verdict, exit_code)


def main():
    parser = argparse.ArgumentParser(description="HORA-Q Independent Evidence Verifier")
    parser.add_argument("file", help="Path to exported evidence JSON file")
    parser.add_argument(
        "--tamper",
        action="store_true",
        help="Simulate a payload mutation to demonstrate tamper rejection",
    )
    parser.add_argument(
        "--allow-unsigned",
        action="store_true",
        help="Accept unsigned records with valid digest (exit code 0 instead of exit code 2)",
    )
    args = parser.parse_args()

    result = verify_evidence_file(args.file, simulate_tamper=args.tamper, allow_unsigned=args.allow_unsigned)
    sys.exit(result.exit_code)


if __name__ == "__main__":
    main()

