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



def verify_evidence_file(file_path: str, simulate_tamper: bool = False) -> bool:
    """Load, inspect, and verify an exported evidence JSON file."""
    if not os.path.exists(file_path):
        print(f"[!] File not found: {file_path}", file=sys.stderr)
        return False

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Detect structure: direct evidence record or wrapped API response
    if "record" in data and isinstance(data["record"], dict):
        record = data["record"]
        expected_hash = data.get("record_hash") or data.get("hash") or data.get("content_hash")
        signature = data.get("signature")
        public_key = data.get("public_key")
        evidence_id = data.get("id") or data.get("evidence_id") or "UNKNOWN"
        signer_status = data.get("signer_status") or "UNSIGNED"
    else:
        record = data
        expected_hash = data.get("record_hash") or data.get("content_hash") or data.get("sha256_hash") or data.get("hash")
        signature = data.get("signature")
        public_key = data.get("public_key")
        evidence_id = data.get("evidence_id") or "DIRECT_RECORD"
        signer_status = "SIGNED" if signature else "UNSIGNED"

    print("=" * 72)
    print(f"HORA-Q Independent Evidence Verification")
    print(f"Evidence ID: {evidence_id}")
    print(f"File Source: {os.path.abspath(file_path)}")
    print("=" * 72)

    if simulate_tamper:
        print("[DEMO] Simulating payload modification (mutating observed_asn)...")
        record = dict(record)
        record["observed_asn"] = "AS99999_TAMPERED"

    # Step 1: Canonicalize
    canon_bytes = canonicalize_json(record)
    computed_hash = compute_sha256(canon_bytes)

    print(f"\n1. Content Integrity (RFC 8785 Canonical JSON & SHA-256):")
    print(f"   Canonical Payload Length: {len(canon_bytes)} bytes")
    print(f"   Computed SHA-256 Digest : {computed_hash}")
    if expected_hash:
        print(f"   Attested SHA-256 Digest : {expected_hash}")
        hash_match = (computed_hash == expected_hash)
        if hash_match:
            print("   Integrity Status        : [PASS] SHA-256 Digest matches attested record.")
        else:
            print("   Integrity Status        : [FAIL] TAMPER DETECTED: Computed digest does NOT match!")
    else:
        hash_match = True
        print("   Integrity Status        : [INFO] Digest calculated from source (no comparison hash).")

    # Step 2: Post-Quantum Signature Verification
    algorithm = data.get("algorithm") or "ML-DSA-65"
    print(f"\n2. Post-Quantum Digital Signature ({algorithm}):")
    sig_match = True
    if signature and public_key:
        print(f"   Attested Algorithm      : {algorithm}")
        print(f"   Signer Status           : {signer_status}")
        print(f"   Public Key (Length)     : {len(public_key)} base64 chars")
        print(f"   Signature (Length)      : {len(signature)} base64 chars")
        valid_sig, msg = verify_mldsa_signature(canon_bytes, signature, public_key, algorithm=algorithm)
        if valid_sig:
            print(f"   Signature Status        : [PASS] {algorithm} signature is mathematically VALID.")
            print(f"   Engine Detail           : {msg}")
        else:
            print(f"   Signature Status        : [FAIL] INVALID SIGNATURE or tampered payload!")
            print(f"   Engine Detail           : {msg}")
            sig_match = False
    else:
        print(f"   Signer Status           : UNSIGNED (Digest recorded; signature key not attached)")
        print(f"   Note                    : Separates recorded content integrity hashes from digital signatures.")


    # Overall Verdict
    overall = hash_match and sig_match
    print("\n" + "=" * 72)
    if overall:
        print("FINAL VERDICT: [AUTHENTIC] Evidence record verified successfully.")
    else:
        print("FINAL VERDICT: [COMPROMISED] Verification failed. Record has been tampered with or corrupted.")
    print("=" * 72)
    return overall


def main():
    parser = argparse.ArgumentParser(description="HORA-Q Independent Evidence Verifier")
    parser.add_argument("file", help="Path to exported evidence JSON file")
    parser.add_argument("--tamper", action="store_true", help="Simulate a payload mutation to demonstrate tamper rejection")
    args = parser.parse_args()

    success = verify_evidence_file(args.file, simulate_tamper=args.tamper)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
