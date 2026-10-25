"""Detection Engine for BGP Origin Changes and Subprefix Anomalies.

Implements the deterministic detection pipeline per Documents 12, 14, 15:
- Baseline seeding (first observation creates baseline, never triggers origin alert)
- Origin-AS Change Detector (compares against baseline, no silent promotion)
- Subprefix / More-Specific Detector (strict subnet containment, same address family)
- Automated Evidence packaging & SHA-256 integrity binding
"""

import ipaddress
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from horaq.database import db_session, get_all_baselines
from horaq.evidence import canonicalize_json, create_evidence_payload
from horaq.normalization import normalize_asn, normalize_prefix, normalize_timestamp


def find_parent_prefixes(
    child_net: ipaddress.IPv4Network | ipaddress.IPv6Network,
    tracked_baselines: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Scan tracked baselines to find any strict parent prefixes in the same IP family."""
    parents = []
    for base in tracked_baselines:
        p_str = base["prefix"]
        try:
            p_net = ipaddress.ip_network(p_str, strict=False)
        except ValueError:
            continue

        # Must be same IP family (IPv4 or IPv6)
        if p_net.version != child_net.version:
            continue

        # Must not be identical (equal prefixes are not subprefixes)
        if p_net == child_net:
            continue

        # Strict subnet test: child_net is contained within p_net
        if child_net.subnet_of(p_net):
            parents.append(base)

    # Sort parents by prefix length descending (closest parent first)
    parents.sort(
        key=lambda b: ipaddress.ip_network(b["prefix"], strict=False).prefixlen,
        reverse=True,
    )
    return parents


def process_observation(
    db_path: str,
    prefix_raw: str,
    origin_asn_raw: Any,
    collector: str = "manual",
    timestamp_raw: Any = None,
    scenario: Optional[str] = None,
    raw_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Ingest and evaluate a BGP route observation against baselines.

    Steps:
    1. Normalization & validation of prefix, ASN, timestamp.
    2. Atomic check against stored baselines.
    3. Detection of origin change and/or subprefix anomaly.
    4. Generation of explainable alerts and cryptographic evidence records.
    5. Atomic database persistence.
    """
    # 1. Normalization
    norm_prefix, ip_version = normalize_prefix(prefix_raw)
    norm_asn = normalize_asn(origin_asn_raw)
    norm_time = normalize_timestamp(timestamp_raw)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    current_net = ipaddress.ip_network(norm_prefix, strict=False)
    metadata_json = json.dumps(raw_metadata or {}, sort_keys=True)

    generated_alerts: List[Dict[str, Any]] = []

    with db_session(db_path) as conn:
        # Fetch current baselines (including candidate status)
        all_baselines = [
            dict(r)
            for r in conn.execute(
                "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, "
                "COALESCE(status, 'PROMOTED') as status FROM baselines;"
            ).fetchall()
        ]

        baseline_map = {b["prefix"]: b for b in all_baselines}
        existing_baseline = baseline_map.get(norm_prefix)

        # Multi-source Corroboration Query
        corroboration = conn.execute(
            "SELECT COUNT(DISTINCT collector) as collector_count, COUNT(*) as total_obs "
            "FROM observations WHERE prefix = ? AND origin_asn = ?;",
            (norm_prefix, norm_asn),
        ).fetchone()
        collector_count = (corroboration["collector_count"] if corroboration else 0) + 1
        total_prev_obs = corroboration["total_obs"] if corroboration else 0

        # A. Check Subprefix Anomaly
        # Look for existing tracked prefixes that are strict parents of this prefix
        parents = find_parent_prefixes(current_net, all_baselines)
        if parents:
            closest_parent = parents[0]
            parent_prefix = closest_parent["prefix"]
            parent_asn = closest_parent["origin_asn"]
            parent_status = closest_parent.get("status", "PROMOTED")

            alert_id = f"alert-{uuid.uuid4().hex[:12]}"
            evidence_id = f"ev-{uuid.uuid4().hex[:12]}"

            severity = "HIGH" if parent_asn != norm_asn else "MEDIUM"
            title = f"More-Specific Prefix Anomaly: {norm_prefix} (Parent: {parent_prefix})"
            
            # Confidence & Uncertainty Assessment
            if parent_asn == norm_asn:
                confidence = "MEDIUM"
                uncertainty_reason = "Same-origin more-specific route. Likely operational traffic engineering or load balancing deaggregation."
            elif collector_count >= 2 or total_prev_obs >= 3:
                confidence = "HIGH"
                uncertainty_reason = "Corroborated across multiple collectors/peers. Widespread global propagation observed."
            else:
                confidence = "MEDIUM"
                uncertainty_reason = "Initial observation from single routing peer. Awaiting broader collector corroboration."

            explanation = (
                f"Observed announcement of more-specific prefix '{norm_prefix}' originating from {norm_asn}. "
                f"A broader parent route '{parent_prefix}' is actively tracked originating from {parent_asn} (Status: {parent_status}). "
                f"In BGP routing, traffic prefers the most-specific prefix match (/ {current_net.prefixlen} vs /{ipaddress.ip_network(parent_prefix).prefixlen}). "
                f"Potential causes: Traffic engineering/load balancing, DDoS mitigation scrubbing, "
                f"unauthorized subprefix interception, or inadvertent route leak."
            )

            # Build evidence record with multi-source correlation
            ev_record, ev_hash = create_evidence_payload(
                alert_id=alert_id,
                prefix=norm_prefix,
                observed_asn=norm_asn,
                baseline_asn=parent_asn,
                parent_prefix=parent_prefix,
                rule_name="SUBPREFIX_CONTAINMENT_RULE",
                severity=severity,
                explanation=explanation,
                timestamp=norm_time,
                collector=collector,
                scenario=scenario,
                context={
                    "parent_prefix": parent_prefix,
                    "parent_origin_asn": parent_asn,
                    "parent_baseline_status": parent_status,
                    "child_prefix_len": current_net.prefixlen,
                    "parent_prefix_len": ipaddress.ip_network(parent_prefix).prefixlen,
                    "all_enclosing_parents": [p["prefix"] for p in parents],
                    "evidence_correlation": {
                        "source_agreement_collectors": collector_count,
                        "prior_observations_count": total_prev_obs,
                        "confidence_assessment": confidence,
                        "uncertainty_reason": uncertainty_reason,
                    },
                },
            )

            alert_obj = {
                "id": alert_id,
                "created_at": norm_time,
                "severity": severity,
                "kind": "SUBPREFIX_ANOMALY",
                "prefix": norm_prefix,
                "observed_asn": norm_asn,
                "baseline_asn": parent_asn,
                "parent_prefix": parent_prefix,
                "title": title,
                "explanation": explanation,
                "evidence_id": evidence_id,
                "status": "ACTIVE",
                "confidence": confidence,
                "uncertainty_reason": uncertainty_reason,
                "collector": collector,
                "scenario": scenario,
                "evidence": {
                    "id": evidence_id,
                    "record": ev_record,
                    "hash": ev_hash,
                },
            }
            generated_alerts.append(alert_obj)

        # B. Check Origin-AS Change or Evaluate Candidate Baseline Policy
        if generated_alerts:
            # CRITICAL SECURITY RULE: Anomaly detected (e.g. Subprefix Containment Anomaly).
            # Suspicious announcements MUST NOT establish or poison trusted baselines!
            pass
        elif existing_baseline is None:
            # Candidate Baseline Policy:
            # If explicitly seeded/pre-authorized, mark as PROMOTED immediately.
            # If discovered from wild observations, mark as CANDIDATE pending corroboration threshold.
            is_explicit_seed = bool(
                (scenario and any(s in scenario.lower() for s in ("baseline", "seed", "demo-seed", "migration-seed", "ipv6-parent-seed")))
                or (raw_metadata and raw_metadata.get("trusted_seed"))
            )
            init_status = "PROMOTED" if is_explicit_seed else "CANDIDATE"

            conn.execute(
                "INSERT INTO baselines (prefix, origin_asn, first_seen, last_seen, observation_count, status, updated_at) "
                "VALUES (?, ?, ?, ?, 1, ?, ?);",
                (norm_prefix, norm_asn, norm_time, norm_time, init_status, now_utc),
            )
        else:
            baseline_asn = existing_baseline["origin_asn"]
            current_status = existing_baseline.get("status", "PROMOTED")

            if baseline_asn == norm_asn:
                # Same origin: update last seen & count; promote candidate if threshold reached
                new_count = existing_baseline["observation_count"] + 1
                PROMOTION_THRESHOLD = 3
                new_status = "PROMOTED" if (current_status == "PROMOTED" or new_count >= PROMOTION_THRESHOLD) else "CANDIDATE"

                conn.execute(
                    "UPDATE baselines SET last_seen = ?, observation_count = ?, status = ?, updated_at = ? "
                    "WHERE prefix = ?;",
                    (norm_time, new_count, new_status, now_utc, norm_prefix),
                )
            else:
                # Changed origin: DO NOT silently overwrite baseline. Generate alert!
                alert_id = f"alert-{uuid.uuid4().hex[:12]}"
                evidence_id = f"ev-{uuid.uuid4().hex[:12]}"
                severity = "HIGH"

                is_migration = bool(scenario and "migration" in scenario.lower())
                
                # Confidence & Uncertainty Assessment
                if is_migration:
                    confidence = "MEDIUM"
                    uncertainty_reason = "Flagged with migration tag; scheduled operator maintenance."
                elif collector_count >= 2 or existing_baseline["observation_count"] >= 5:
                    confidence = "HIGH"
                    uncertainty_reason = "Corroborated conflict against long-standing established baseline."
                else:
                    confidence = "MEDIUM"
                    uncertainty_reason = "Single-peer observation. Corroborating across additional peers in progress."

                title = f"Origin ASN Conflict Detected for {norm_prefix}"
                explanation = (
                    f"Observation for prefix '{norm_prefix}' announced with origin {norm_asn}, "
                    f"differing from stored reference baseline origin {baseline_asn} (Status: {current_status}). "
                    f"{'Note: This observation was labeled as legitimate migration scenario. ' if is_migration else ''}"
                    f"Potential causes: Unauthorized route hijack / spoofing, legitimate multi-homing or ASN migration, "
                    f"upstream transit misconfiguration, or route leak."
                )

                ev_record, ev_hash = create_evidence_payload(
                    alert_id=alert_id,
                    prefix=norm_prefix,
                    observed_asn=norm_asn,
                    baseline_asn=baseline_asn,
                    parent_prefix=None,
                    rule_name="ORIGIN_AS_DIFFERENCE_RULE",
                    severity=severity,
                    explanation=explanation,
                    timestamp=norm_time,
                    collector=collector,
                    scenario=scenario,
                    context={
                        "baseline_first_seen": existing_baseline["first_seen"],
                        "baseline_last_seen": existing_baseline["last_seen"],
                        "baseline_observation_count": existing_baseline["observation_count"],
                        "baseline_status": current_status,
                        "evidence_correlation": {
                            "source_agreement_collectors": collector_count,
                            "prior_observations_count": total_prev_obs,
                            "confidence_assessment": confidence,
                            "uncertainty_reason": uncertainty_reason,
                        },
                    },
                )

                alert_obj = {
                    "id": alert_id,
                    "created_at": norm_time,
                    "severity": severity,
                    "kind": "ORIGIN_CHANGE",
                    "prefix": norm_prefix,
                    "observed_asn": norm_asn,
                    "baseline_asn": baseline_asn,
                    "parent_prefix": None,
                    "title": title,
                    "explanation": explanation,
                    "evidence_id": evidence_id,
                    "status": "ACTIVE",
                    "confidence": confidence,
                    "uncertainty_reason": uncertainty_reason,
                    "collector": collector,
                    "scenario": scenario,
                    "evidence": {
                        "id": evidence_id,
                        "record": ev_record,
                        "hash": ev_hash,
                    },
                }
                generated_alerts.append(alert_obj)

        # C. Insert Observation Record
        cur = conn.execute(
            "INSERT INTO observations (prefix, origin_asn, collector, observed_at, scenario, raw_metadata, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?);",
            (norm_prefix, norm_asn, collector, norm_time, scenario, metadata_json, now_utc),
        )
        obs_id = cur.lastrowid

        # D. Insert Alerts and Evidence Records
        for alert in generated_alerts:
            conn.execute(
                "INSERT INTO alerts (id, created_at, severity, kind, prefix, observed_asn, baseline_asn, "
                "parent_prefix, title, explanation, evidence_id, status, confidence, uncertainty_reason, collector, scenario) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                (
                    alert["id"],
                    alert["created_at"],
                    alert["severity"],
                    alert["kind"],
                    alert["prefix"],
                    alert["observed_asn"],
                    alert["baseline_asn"],
                    alert["parent_prefix"],
                    alert["title"],
                    alert["explanation"],
                    alert["evidence_id"],
                    alert["status"],
                    alert.get("confidence", "HIGH"),
                    alert.get("uncertainty_reason"),
                    alert["collector"],
                    alert["scenario"],
                ),
            )

            ev = alert["evidence"]
            conn.execute(
                "INSERT INTO evidence (id, alert_id, schema_version, canonical_json, record_hash, algorithm, "
                "signature, public_key, signer_status, created_at) "
                "VALUES (?, ?, '1.0.0', ?, ?, 'NONE', NULL, NULL, 'UNSIGNED', ?);",
                (
                    ev["id"],
                    alert["id"],
                    canonicalize_json(ev["record"]).decode("utf-8"),
                    ev["hash"],
                    now_utc,
                ),
            )

        conn.commit()

    return {
        "observation_id": obs_id,
        "prefix": norm_prefix,
        "origin_asn": norm_asn,
        "observed_at": norm_time,
        "collector": collector,
        "scenario": scenario,
        "status": "ACCEPTED",
        "alerts_count": len(generated_alerts),
        "alerts": generated_alerts,
    }
