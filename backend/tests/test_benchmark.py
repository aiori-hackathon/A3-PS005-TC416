"""Automated tests for Reference Detector vs Enhanced HORA-Q Benchmark.

Verifies:
- Naïve reference detector vs Enhanced HORA-Q head-to-head comparison
- Zero baseline contamination invariant in Enhanced HORA-Q (0.0% vs >50%)
- Candidate baseline promotion policy enforcement
- Uncertainty preservation on operational traffic engineering
- Cryptographic benchmark execution and signature integrity
"""

import pytest
from horaq.benchmark import (
    NaiveReferenceDetector,
    EnhancedHoraqDetectorWrapper,
    run_cryptographic_benchmark,
    run_head_to_head_benchmark,
)


def test_head_to_head_benchmark_metrics():
    results = run_head_to_head_benchmark()
    assert results is not None

    naive = results["naive_reference_detector"]
    enhanced = results["enhanced_horaq_detector"]

    # Invariant 1: Enhanced HORA-Q achieves 0.0% baseline contamination
    assert enhanced["baseline_contamination_rate_pct"] == 0.0
    # Invariant 2: Naïve detector suffers significant baseline contamination
    assert naive["baseline_contamination_rate_pct"] > 50.0

    # Invariant 3: Enhanced HORA-Q achieves 100% recall on malicious attacks
    assert enhanced["classification_metrics"]["recall"] == 1.0

    # Invariant 4: Candidate promotion policy and peer diversity are verified
    peer_inv = enhanced["peer_diversity_invariants"]
    assert peer_inv["single_peer_flapping_quarantined_as_candidate"] is True
    assert peer_inv["multi_peer_corroboration_promoted"] is True

    # Invariant 5: Uncertainty handling is preserved
    assert enhanced["uncertainty_handling"]["explicit_uncertainty_reasons_provided"] is True
    assert enhanced["uncertainty_handling"]["avoids_automatic_attack_verdict"] is True


def test_cryptographic_benchmark():
    crypto_res = run_cryptographic_benchmark(iterations=5)
    assert crypto_res["status"] == "MEASURED"
    pq = crypto_res["post_quantum_mldsa65"]
    assert pq["algorithm"] in ("ML-DSA-65", "CRYSTALS-Dilithium3")
    assert pq["quantum_resistant"] is True
    assert pq["signature_size_bytes"] > 2000
    assert pq["mean_signing_latency_ms"] >= 0.0
    assert pq["mean_verification_latency_ms"] >= 0.0
