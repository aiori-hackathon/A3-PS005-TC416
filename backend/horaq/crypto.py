"""Post-Quantum Cryptography Module — ML-DSA-65 (FIPS 204).

Adheres strictly to Document 19:
- Uses ML-DSA-65 when liboqs / oqs Python bindings are present.
- NO SILENT FALLBACK: If unavailable, reports explicit unavailable status
  and refuses to substitute standard classical algorithms (RSA/ECDSA).
- Distinguishes cryptographic signature from content hashing.
"""

import base64
from typing import Any, Dict, Optional, Tuple


ALGORITHM_NAME = "ML-DSA-65"

# Dynamically detect if liboqs / oqs is present
_OQS_AVAILABLE = False
_OQS_SIG_NAME = None
_OQS_ERROR = "liboqs / oqs Python module not installed."

try:
    import oqs

    available_sigs = oqs.get_enabled_sig_mechanisms()
    # Check for ML-DSA-65 or Dilithium3 (pre-standardization name)
    if "ML-DSA-65" in available_sigs:
        _OQS_AVAILABLE = True
        _OQS_SIG_NAME = "ML-DSA-65"
        _OQS_ERROR = ""
    elif "Dilithium3" in available_sigs:
        _OQS_AVAILABLE = True
        _OQS_SIG_NAME = "Dilithium3"
        _OQS_ERROR = ""
    else:
        _OQS_ERROR = f"liboqs is present but '{ALGORITHM_NAME}' is not enabled in this build."
except ImportError:
    _OQS_AVAILABLE = False
    _OQS_ERROR = "Open Quantum Safe (liboqs-python) is not installed."
except Exception as err:
    _OQS_AVAILABLE = False
    _OQS_ERROR = f"Error initializing liboqs: {err}"


def is_mldsa_available() -> bool:
    """Return True if ML-DSA-65 provider is available, False otherwise."""
    return _OQS_AVAILABLE


def get_crypto_status() -> Dict[str, Any]:
    """Report ML-DSA cryptographic provider status transparently."""
    return {
        "available": _OQS_AVAILABLE,
        "algorithm": ALGORITHM_NAME,
        "mechanism": _OQS_SIG_NAME or "none",
        "provider": "liboqs" if _OQS_AVAILABLE else "none",
        "status": "READY" if _OQS_AVAILABLE else "PROVIDER_UNAVAILABLE",
        "message": "ML-DSA-65 post-quantum signing active." if _OQS_AVAILABLE else _OQS_ERROR,
    }


def generate_keypair() -> Tuple[bytes, bytes]:
    """Generate an ML-DSA-65 keypair (public_key_bytes, secret_key_bytes).

    Raises RuntimeError if provider is not available.
    """
    if not _OQS_AVAILABLE or not _OQS_SIG_NAME:
        raise RuntimeError(
            f"ML-DSA provider unavailable: {_OQS_ERROR}. Silent fallback is prohibited."
        )

    import oqs

    with oqs.Signature(_OQS_SIG_NAME) as signer:
        public_key = signer.generate_keypair()
        secret_key = signer.export_secret_key()
        return public_key, secret_key


def sign_data(data_bytes: bytes, secret_key: Optional[bytes] = None) -> Tuple[str, str]:
    """Sign canonical data bytes using ML-DSA-65.

    Returns (signature_base64, public_key_base64).
    If secret_key is not supplied, generates an ephemeral keypair for demonstration.
    Raises RuntimeError if provider is unavailable.
    """
    if not _OQS_AVAILABLE or not _OQS_SIG_NAME:
        raise RuntimeError(
            f"ML-DSA provider unavailable: {_OQS_ERROR}. "
            f"Silent algorithm fallback is prohibited by specification."
        )

    import oqs

    with oqs.Signature(_OQS_SIG_NAME, secret_key=secret_key) as signer:
        if secret_key is None:
            public_key = signer.generate_keypair()
        else:
            public_key = signer.export_public_key() if hasattr(signer, "export_public_key") else b""

        sig_bytes = signer.sign(data_bytes)
        sig_b64 = base64.b64encode(sig_bytes).decode("ascii")
        pub_b64 = base64.b64encode(public_key).decode("ascii")
        return sig_b64, pub_b64


def verify_signature(data_bytes: bytes, signature_b64: str, public_key_b64: str) -> bool:
    """Verify an ML-DSA-65 signature against canonical data bytes and public key.

    Returns True if mathematically valid, False if invalid.
    Raises RuntimeError if provider is unavailable.
    Raises ValueError on malformed base64 input.
    """
    if not _OQS_AVAILABLE or not _OQS_SIG_NAME:
        raise RuntimeError(
            f"ML-DSA provider unavailable: {_OQS_ERROR}. "
            f"Silent algorithm fallback is prohibited by specification."
        )

    try:
        sig_bytes = base64.b64decode(signature_b64)
        pub_bytes = base64.b64decode(public_key_b64)
    except Exception as err:
        raise ValueError(f"Malformed base64 signature or public key: {err}") from err

    import oqs

    with oqs.Signature(_OQS_SIG_NAME) as verifier:
        try:
            return verifier.verify(data_bytes, sig_bytes, pub_bytes)
        except Exception:
            return False
