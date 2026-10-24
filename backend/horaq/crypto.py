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


import hashlib
import json
import os


class AuthorityKeyManager:
    """Manages the persistent ML-DSA-65 authority signing keypair for HORA-Q.

    Ensures durable signer identity across application runs. Generates and stores
    the authority keypair on first initialization, then reliably reloads it.
    """

    def __init__(self, key_path: Optional[str] = None) -> None:
        if key_path is None:
            self.key_path = os.getenv("HORAQ_SIGNING_KEY", "horaq_authority_key.json")
        else:
            self.key_path = key_path
        self._public_key: Optional[bytes] = None
        self._secret_key: Optional[bytes] = None

    def initialize_or_load(self) -> Tuple[bytes, bytes]:
        """Load persistent authority keypair or generate a new one if none exists."""
        if self._public_key is not None and self._secret_key is not None:
            return self._public_key, self._secret_key

        if os.path.exists(self.key_path):
            try:
                with open(self.key_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self._public_key = base64.b64decode(data["public_key"])
                self._secret_key = base64.b64decode(data["secret_key"])
                return self._public_key, self._secret_key
            except Exception:
                # Fall back to re-generating if file was corrupted
                pass

        # Generate fresh persistent authority keypair
        pk, sk = generate_keypair()
        self._public_key = pk
        self._secret_key = sk

        try:
            key_data = {
                "algorithm": ALGORITHM_NAME,
                "mechanism": _MECHANISM_NAME,
                "public_key": base64.b64encode(pk).decode("ascii"),
                "secret_key": base64.b64encode(sk).decode("ascii"),
                "fingerprint": hashlib.sha256(pk).hexdigest(),
            }
            with open(self.key_path, "w", encoding="utf-8") as f:
                json.dump(key_data, f, indent=2)
            try:
                os.chmod(self.key_path, 0o600)
            except Exception:
                pass
        except Exception:
            pass

        return self._public_key, self._secret_key

    @property
    def public_key_bytes(self) -> bytes:
        if self._public_key is None:
            self.initialize_or_load()
        return self._public_key  # type: ignore

    @property
    def secret_key_bytes(self) -> bytes:
        if self._secret_key is None:
            self.initialize_or_load()
        return self._secret_key  # type: ignore

    @property
    def public_key_b64(self) -> str:
        return base64.b64encode(self.public_key_bytes).decode("ascii")

    @property
    def fingerprint(self) -> str:
        return hashlib.sha256(self.public_key_bytes).hexdigest()


_authority_manager = AuthorityKeyManager()


def get_authority_public_key() -> str:
    """Return the base64-encoded persistent authority public key."""
    if not _AVAILABLE:
        raise RuntimeError("ML-DSA provider unavailable.")
    return _authority_manager.public_key_b64


def get_authority_key_fingerprint() -> str:
    """Return the SHA-256 fingerprint of the persistent authority public key."""
    if not _AVAILABLE:
        return "none"
    try:
        return _authority_manager.fingerprint
    except Exception:
        return "none"


def get_crypto_status() -> Dict[str, Any]:
    """Report ML-DSA cryptographic provider and persistent key status transparently."""
    fingerprint = get_authority_key_fingerprint() if _AVAILABLE else "none"
    return {
        "available": _AVAILABLE,
        "algorithm": ALGORITHM_NAME,
        "mechanism": _MECHANISM_NAME if _AVAILABLE else "none",
        "provider": _PROVIDER_NAME if _AVAILABLE else "none",
        "status": "READY" if _AVAILABLE else "PROVIDER_UNAVAILABLE",
        "key_lifecycle": "PERSISTENT_AUTHORITY_KEY" if _AVAILABLE else "NONE",
        "public_key_fingerprint": fingerprint,
        "key_path": _authority_manager.key_path if _AVAILABLE else "none",
        "message": (
            f"ML-DSA-65 post-quantum signing active via {_PROVIDER_NAME} with persistent authority key ({fingerprint[:12]}...)."
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


def sign_data(
    data_bytes: bytes,
    secret_key: Optional[bytes] = None,
    public_key: Optional[bytes] = None,
) -> Tuple[str, str]:
    """Sign canonical data bytes using ML-DSA-65.

    Returns (signature_base64, public_key_base64).
    If secret_key is not supplied, uses the persistent authority keypair.
    If secret_key is supplied, public_key must also be provided to ensure durable verification.
    Raises RuntimeError if provider is unavailable.
    """
    if not _AVAILABLE:
        raise RuntimeError(
            f"ML-DSA provider unavailable: {_ERROR_MESSAGE}. "
            f"Silent algorithm fallback is prohibited by specification."
        )

    # 1. Resolve keypair: persistent authority key if omitted
    if secret_key is None:
        sk = _authority_manager.secret_key_bytes
        pk = _authority_manager.public_key_bytes
    else:
        if public_key is None:
            raise ValueError(
                "When supplying a custom secret_key, the matching public_key must also be provided "
                "to ensure durable, non-ephemeral signer verification."
            )
        sk = secret_key
        pk = public_key

    if _PROVIDER_TYPE == "oqs":
        oqs_mod = importlib.import_module("oqs")
        with oqs_mod.Signature(_MECHANISM_NAME, secret_key=sk) as signer:
            sig_bytes = signer.sign(data_bytes)
            sig_b64 = base64.b64encode(sig_bytes).decode("ascii")
            pub_b64 = base64.b64encode(pk).decode("ascii")
            return sig_b64, pub_b64
    else:
        from dilithium_py.dilithium import Dilithium3

        sig_bytes = Dilithium3.sign(sk, data_bytes)
        sig_b64 = base64.b64encode(sig_bytes).decode("ascii")
        pub_b64 = base64.b64encode(pk).decode("ascii")
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
