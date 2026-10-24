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

