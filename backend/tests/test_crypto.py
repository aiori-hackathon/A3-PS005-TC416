import base64
import pytest
from horaq.crypto import (
    ALGORITHM_NAME,
    get_crypto_status,
    is_mldsa_available,
    sign_data,
    verify_signature,
)


def test_crypto_status_reporting():
    status = get_crypto_status()
    assert "available" in status
    assert status["algorithm"] == ALGORITHM_NAME
    assert "status" in status
    assert "message" in status


def test_crypto_behavior():
    available = is_mldsa_available()
    test_data = b"Canonical test evidence payload for HORA-Q"

    if not available:
        # Strict requirement: Must raise explicit error rather than silently falling back
        with pytest.raises(RuntimeError, match="Silent algorithm fallback is prohibited"):
            sign_data(test_data)

        with pytest.raises(RuntimeError, match="Silent algorithm fallback is prohibited"):
            verify_signature(test_data, "fake_sig", "fake_key")
    else:
        # If liboqs is present in environment, test full signing and verification
        sig_b64, pub_b64 = sign_data(test_data)
        assert isinstance(sig_b64, str)
        assert isinstance(pub_b64, str)

        # Successful verification
        valid = verify_signature(test_data, sig_b64, pub_b64)
        assert valid is True

        # Tampered message fails verification
        tampered_data = b"Tampered evidence payload"
        assert verify_signature(tampered_data, sig_b64, pub_b64) is False

        # Corrupted signature bytes fail verification
        import base64
        corrupted_sig = base64.b64encode(b"corrupted_signature_payload_bytes_0000").decode("ascii")
        assert verify_signature(test_data, corrupted_sig, pub_b64) is False


def test_corrupted_signature_rejected():
    """Verify that an altered signature is rejected even when the payload is authentic."""
    if not is_mldsa_available():
        pytest.skip("ML-DSA provider not available in environment")

    test_data = b'{"alert_id":"alert-001","prefix":"1.1.1.0/24"}'
    sig_b64, pub_b64 = sign_data(test_data)

    # 1. Authentic passes
    assert verify_signature(test_data, sig_b64, pub_b64) is True

    # 2. Corrupt one byte of the signature
    sig_bytes = bytearray(base64.b64decode(sig_b64))
    sig_bytes[10] ^= 0xFF
    corrupted_sig_b64 = base64.b64encode(sig_bytes).decode("ascii")

    # 3. Must be mathematically rejected
    assert verify_signature(test_data, corrupted_sig_b64, pub_b64) is False


def test_persistent_authority_key_lifecycle():
    """Verify that sign_data uses the durable persistent authority key rather than ephemeral keys."""
    if not is_mldsa_available():
        pytest.skip("ML-DSA provider not available in environment")

    from horaq.crypto import get_authority_public_key, get_authority_key_fingerprint
    import hashlib

    # 1. Inspect authority key
    auth_pub_b64 = get_authority_public_key()
    fingerprint = get_authority_key_fingerprint()
    pub_bytes = base64.b64decode(auth_pub_b64)
    assert hashlib.sha256(pub_bytes).hexdigest() == fingerprint

    # 2. Sign two distinct payloads
    p1 = b"Payload 1"
    p2 = b"Payload 2"
    sig1, pk1 = sign_data(p1)
    sig2, pk2 = sign_data(p2)

    # 3. Public key must remain durable and identical across both signings
    assert pk1 == auth_pub_b64
    assert pk2 == auth_pub_b64
    assert pk1 == pk2

    # 4. Both signatures verify against the same persistent authority public key
    assert verify_signature(p1, sig1, auth_pub_b64) is True
    assert verify_signature(p2, sig2, auth_pub_b64) is True


def test_custom_secret_key_requires_public_key():
    """Verify that supplying a secret_key without public_key raises ValueError."""
    if not is_mldsa_available():
        pytest.skip("ML-DSA provider not available in environment")

    from horaq.crypto import generate_keypair
    pk, sk = generate_keypair()

    # Must raise ValueError if public_key is omitted
    with pytest.raises(ValueError, match="matching public_key must also be provided"):
        sign_data(b"test", secret_key=sk, public_key=None)

    # Must succeed when both are supplied
    sig_b64, pub_b64 = sign_data(b"test", secret_key=sk, public_key=pk)
    assert verify_signature(b"test", sig_b64, pub_b64) is True

