"""Unit tests for prefix, ASN, and timestamp normalization."""

import pytest
from datetime import datetime, timezone
from horaq.normalization import (
    normalize_asn,
    normalize_prefix,
    normalize_timestamp,
)


def test_normalize_prefix_ipv4_valid():
    prefix, ver = normalize_prefix("192.0.2.0/24")
    assert prefix == "192.0.2.0/24"
    assert ver == 4


def test_normalize_prefix_host_bit_normalization():
    # Host bits set in CIDR should normalize to the network address
    prefix, ver = normalize_prefix("192.0.2.129/24")
    assert prefix == "192.0.2.0/24"
    assert ver == 4


def test_normalize_prefix_ipv6_valid():
    prefix, ver = normalize_prefix("2001:db8:abcd::/48")
    assert prefix == "2001:db8:abcd::/48"
    assert ver == 6


def test_normalize_prefix_whitespace():
    prefix, ver = normalize_prefix("  10.0.0.0/8  \n")
    assert prefix == "10.0.0.0/8"
    assert ver == 4


def test_normalize_prefix_invalid_missing_mask():
    with pytest.raises(ValueError, match="missing CIDR mask"):
        normalize_prefix("192.0.2.1")


def test_normalize_prefix_invalid_characters():
    with pytest.raises(ValueError, match="Invalid IP prefix"):
        normalize_prefix("invalid-ip/24")


def test_normalize_asn_integer():
    assert normalize_asn(13335) == "AS13335"
    assert normalize_asn(64496) == "AS64496"
    assert normalize_asn(4294967295) == "AS4294967295"


def test_normalize_asn_string():
    assert normalize_asn("13335") == "AS13335"
    assert normalize_asn("AS13335") == "AS13335"
    assert normalize_asn("as13335") == "AS13335"
    assert normalize_asn("  AS64512  ") == "AS64512"


def test_normalize_asn_as0_rejected():
    with pytest.raises(ValueError, match="AS0 is reserved"):
        normalize_asn(0)
    with pytest.raises(ValueError, match="AS0 is reserved"):
        normalize_asn("AS0")


def test_normalize_asn_negative_rejected():
    with pytest.raises(ValueError):
        normalize_asn(-1)


def test_normalize_asn_out_of_range():
    with pytest.raises(ValueError, match="exceeds 32-bit range"):
        normalize_asn(4294967296)


def test_normalize_asn_asdot_rejected():
    with pytest.raises(ValueError, match="ASDOT format '1.10' is not supported"):
        normalize_asn("1.10")


def test_normalize_timestamp_default():
    ts = normalize_timestamp()
    assert ts.endswith("Z")
    assert "T" in ts


def test_normalize_timestamp_iso():
    iso_input = "2026-10-21T07:00:00Z"
    ts = normalize_timestamp(iso_input)
    assert "2026-10-21T07:00:00" in ts


def test_normalize_timestamp_invalid():
    with pytest.raises(ValueError, match="Invalid ISO 8601"):
        normalize_timestamp("not-a-timestamp")
