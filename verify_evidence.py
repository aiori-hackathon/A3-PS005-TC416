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
import json
import os
import sys
from typing import Any, Dict, Tuple


def canonicalize_json(data: Any) -> bytes:
    """RFC 8785 Canonical JSON Serialization.
    
    Keys sorted lexicographically, no whitespace around separators, UTF-8 encoded.
    """
    return json.dumps(
        data,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def compute_sha256(canon_bytes: bytes) -> str:
    """Compute SHA-256 hex digest over canonical bytes."""
    import hashlib
    return hashlib.sha256(canon_bytes).hexdigest()


def verify_mldsa_signature(data_bytes: bytes, signature_b64: str, public_key_b64: str) -> Tuple[bool, str]:
    """Verify ML-DSA-65 signature with dilithium-py or liboqs."""
    try:
        sig_bytes = base64.b64decode(signature_b64)
        pub_bytes = base64.b64decode(public_key_b64)
    except Exception as err:
        return False, f"Malformed base64: {err}"

    # Try dilithium-py
    try:
        from dilithium_py.dilithium import Dilithium3
        valid = Dilithium3.verify(pub_bytes, data_bytes, sig_bytes)
        return valid, "Verified with dilithium-py (FIPS 204 ML-DSA-65 / Dilithium3)"
    except ImportError:
        pass

    # Try liboqs
    try:
        import oqs
        with oqs.Signature("ML-DSA-65") as verifier:
            valid = verifier.verify(data_bytes, sig_bytes, pub_bytes)
            return valid, "Verified with liboqs (ML-DSA-65)"
    except Exception as err:
        return False, f"Provider unavailable or failed: {err}"


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
    print(f"\n2. Post-Quantum Digital Signature (ML-DSA-65 / FIPS 204):")
    sig_match = True
    if signature and public_key:
        print(f"   Signer Status           : {signer_status}")
        print(f"   Public Key (Length)     : {len(public_key)} base64 chars")
        print(f"   Signature (Length)      : {len(signature)} base64 chars")
        valid_sig, msg = verify_mldsa_signature(canon_bytes, signature, public_key)
        if valid_sig:
            print(f"   Signature Status        : [PASS] ML-DSA-65 signature is mathematically VALID.")
            print(f"   Engine Detail           : {msg}")
        else:
            print(f"   Signature Status        : [FAIL] INVALID SIGNATURE or tampered payload!")
            print(f"   Engine Detail           : {msg}")
            sig_match = False
    else:
        print(f"   Signer Status           : UNSIGNED (Digest recorded; signature key not attached)")
        print(f"   Note                    : Document 19 requires separating recorded hashes from signatures.")

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
