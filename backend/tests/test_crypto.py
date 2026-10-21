"""Unit tests for ML-DSA-65 post-quantum signature behavior and no-fallback enforcement."""

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
