"""Tests for WP-08: Evaluator Reproducibility, Honest Benchmarks, and Versioned Metadata."""

import pytest
from horaq.benchmark import run_head_to_head_benchmark


def test_benchmark_has_version_and_checksum_metadata():
    """Benchmark output includes dataset SHA-256, detector/rule versions, and ground truth provenance."""
    results = run_head_to_head_benchmark()
    assert results["dataset_sha256"] is not None
    assert len(results["dataset_sha256"]) == 64  # SHA-256 hex string
    assert results["detector_version"] == "2.0.0"
    assert results["rule_version"] == "2.0.0"
    assert results["ground_truth_available"] is True
    assert "YouTube/PTCL" in results["ground_truth_provenance"]


def test_repeated_runs_yield_identical_metrics_deterministic():
    """Repeated runs of the benchmark yield identical classification metrics and determinism."""
    run1 = run_head_to_head_benchmark()
    run2 = run_head_to_head_benchmark()

    # Same dataset SHA-256
    assert run1["dataset_sha256"] == run2["dataset_sha256"]

    # Same metrics
    assert run1["enhanced_horaq_detector"]["classification_metrics"] == run2["enhanced_horaq_detector"]["classification_metrics"]
    assert run1["naive_reference_detector"]["classification_metrics"] == run2["naive_reference_detector"]["classification_metrics"]
    assert run1["enhanced_horaq_detector"]["baseline_contamination_rate_pct"] == run2["enhanced_horaq_detector"]["baseline_contamination_rate_pct"]


def test_stream_breakdown_separates_synthetic_and_historical():
    """Evaluation breakdown explicitly separates synthetic controls from historical cases."""
    results = run_head_to_head_benchmark()
    breakdown = results["evaluation_stream_breakdown"]
    assert breakdown["historical_cases"] == 2
    assert breakdown["synthetic_controls"] == 8
    assert breakdown["synthetic_attacks"] == 2
    assert breakdown["total_cases"] == 14

    # Honest disclaimer present
    disclaimer = results["preliminary_benchmark_disclaimer"]
    assert "rather than claiming universal Internet-wide accuracy statistics" in disclaimer
    assert "Synthetic controls are labeled explicitly" in disclaimer


def test_peer_session_diversity_invariants():
    """Enhanced detector reports explicit peer session diversity verification."""
    results = run_head_to_head_benchmark()
    enhanced = results["enhanced_horaq_detector"]
    inv = enhanced["peer_diversity_invariants"]
    assert inv["peer_session_diversity_verified"] is True
    assert inv["distinct_peer_sessions_required"] == 2
    assert inv["min_observations_required"] == 3
