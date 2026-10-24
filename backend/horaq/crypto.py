"""Post-Quantum Cryptography Module — ML-DSA-65 (FIPS 204).

Adheres strictly to Document 19:
- Uses ML-DSA-65 when liboqs / oqs Python bindings OR native dilithium-py is present.
- NO SILENT FALLBACK: If unavailable, reports explicit unavailable status
  and refuses to substitute standard classical algorithms (RSA/ECDSA).
- Distinguishes cryptographic signature from content hashing.
"""

import base64
import importlib
from typing import Any, Dict, Optional, Tuple


ALGORITHM_NAME = "ML-DSA-65"

_PROVIDER_TYPE = "none"  # "oqs" or "dilithium-py" or "none"
_PROVIDER_NAME = "none"
_MECHANISM_NAME = "none"
_AVAILABLE = False
_ERROR_MESSAGE = ""

# 1. Try liboqs / oqs first
try:
    oqs_mod = importlib.import_module("oqs")
    available_sigs = oqs_mod.get_enabled_sig_mechanisms()
    if "ML-DSA-65" in available_sigs:
        _AVAILABLE = True
        _PROVIDER_TYPE = "oqs"
        _PROVIDER_NAME = "liboqs"
        _MECHANISM_NAME = "ML-DSA-65"
    elif "Dilithium3" in available_sigs:
        _AVAILABLE = True
        _PROVIDER_TYPE = "oqs"
        _PROVIDER_NAME = "liboqs"
        _MECHANISM_NAME = "Dilithium3"
except Exception:
    pass

# 2. Try native dilithium-py (FIPS 204 / Dilithium3)
if not _AVAILABLE:
    try:
        from dilithium_py.dilithium import Dilithium3

        _AVAILABLE = True
        _PROVIDER_TYPE = "dilithium-py"
        _PROVIDER_NAME = "dilithium-py"
        _MECHANISM_NAME = "ML-DSA-65 (Dilithium3)"
    except Exception as err:
        _AVAILABLE = False
        _ERROR_MESSAGE = f"Neither liboqs nor dilithium-py is installed: {err}"

if not _AVAILABLE and not _ERROR_MESSAGE:
    _ERROR_MESSAGE = "ML-DSA-65 cryptographic provider is not installed."


def is_mldsa_available() -> bool:
    """Return True if ML-DSA-65 provider is available, False otherwise."""
    return _AVAILABLE


def get_crypto_status() -> Dict[str, Any]:
    """Report ML-DSA cryptographic provider status transparently."""
    return {
        "available": _AVAILABLE,
        "algorithm": ALGORITHM_NAME,
        "mechanism": _MECHANISM_NAME if _AVAILABLE else "none",
        "provider": _PROVIDER_NAME if _AVAILABLE else "none",
        "status": "READY" if _AVAILABLE else "PROVIDER_UNAVAILABLE",
        "message": (
            f"ML-DSA-65 post-quantum signing active via {_PROVIDER_NAME}."
            if _AVAILABLE
            else _ERROR_MESSAGE
        ),
    }


def generate_keypair() -> Tuple[bytes, bytes]:
    """Generate an ML-DSA-65 keypair (public_key_bytes, secret_key_bytes).

    Raises RuntimeError if provider is not available.
    """
    if not _AVAILABLE:
        raise RuntimeError(
            f"ML-DSA provider unavailable: {_ERROR_MESSAGE}. Silent fallback is prohibited."
        )

    if _PROVIDER_TYPE == "oqs":
        oqs_mod = importlib.import_module("oqs")
        with oqs_mod.Signature(_MECHANISM_NAME) as signer:
            public_key = signer.generate_keypair()
            secret_key = signer.export_secret_key()
            return public_key, secret_key
    else:
        from dilithium_py.dilithium import Dilithium3

        pk, sk = Dilithium3.keygen()
        return pk, sk


def sign_data(data_bytes: bytes, secret_key: Optional[bytes] = None) -> Tuple[str, str]:
    """Sign canonical data bytes using ML-DSA-65.

    Returns (signature_base64, public_key_base64).
    If secret_key is not supplied, generates an ephemeral keypair for demonstration.
    Raises RuntimeError if provider is unavailable.
    """
    if not _AVAILABLE:
        raise RuntimeError(
            f"ML-DSA provider unavailable: {_ERROR_MESSAGE}. "
            f"Silent algorithm fallback is prohibited by specification."
        )

    if _PROVIDER_TYPE == "oqs":
        oqs_mod = importlib.import_module("oqs")
        with oqs_mod.Signature(_MECHANISM_NAME, secret_key=secret_key) as signer:
            if secret_key is None:
                public_key = signer.generate_keypair()
            else:
                public_key = (
                    signer.export_public_key()
                    if hasattr(signer, "export_public_key")
                    else b""
                )

            sig_bytes = signer.sign(data_bytes)
            sig_b64 = base64.b64encode(sig_bytes).decode("ascii")
            pub_b64 = base64.b64encode(public_key).decode("ascii")
            return sig_b64, pub_b64
    else:
        from dilithium_py.dilithium import Dilithium3

        if secret_key is None:
            public_key, secret_key = Dilithium3.keygen()
        else:
            public_key = b""

        sig_bytes = Dilithium3.sign(secret_key, data_bytes)
        sig_b64 = base64.b64encode(sig_bytes).decode("ascii")
        pub_b64 = base64.b64encode(public_key).decode("ascii")
        return sig_b64, pub_b64


def verify_signature(data_bytes: bytes, signature_b64: str, public_key_b64: str) -> bool:
    """Verify an ML-DSA-65 signature against canonical data bytes and public key.

    Returns True if mathematically valid, False if invalid.
    Raises RuntimeError if provider is unavailable.
    Raises ValueError on malformed base64 input.
    """
    if not _AVAILABLE:
        raise RuntimeError(
            f"ML-DSA provider unavailable: {_ERROR_MESSAGE}. "
            f"Silent algorithm fallback is prohibited by specification."
        )

    try:
        sig_bytes = base64.b64decode(signature_b64)
        pub_bytes = base64.b64decode(public_key_b64)
    except Exception as err:
        raise ValueError(f"Malformed base64 signature or public key: {err}") from err

    if _PROVIDER_TYPE == "oqs":
        oqs_mod = importlib.import_module("oqs")
        with oqs_mod.Signature(_MECHANISM_NAME) as verifier:
            try:
                return verifier.verify(data_bytes, sig_bytes, pub_bytes)
            except Exception:
                return False
    else:
        from dilithium_py.dilithium import Dilithium3

        try:
            return Dilithium3.verify(pub_bytes, data_bytes, sig_bytes)
        except Exception:
            return False
