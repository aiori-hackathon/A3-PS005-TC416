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

from horaq.database import db_session, get_all_baselines, record_baseline_transition
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
    peer_as: Optional[str] = None,
    peer_ip: Optional[str] = None,
    authorized_seed: bool = False,
    actor: str = "SYSTEM_POLICY",
) -> Dict[str, Any]:
    """Ingest and evaluate a BGP route observation against baselines.

    Steps:
    1. Normalization & validation of prefix, ASN, timestamp.
    2. Atomic check against stored baselines.
    3. Detection of origin change and/or subprefix anomaly.
    4. Generation of explainable alerts and cryptographic evidence records.
    5. Immutable versioned baseline history recording (Proposal D2).
    6. Atomic database persistence.
    """
    # 1. Normalization
    norm_prefix, ip_version = normalize_prefix(prefix_raw)
    norm_asn = normalize_asn(origin_asn_raw)
    norm_time = normalize_timestamp(timestamp_raw)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    if raw_metadata:
        peer_as = peer_as or str(raw_metadata.get("peer_as") or "") or None
        peer_ip = peer_ip or str(raw_metadata.get("peer_ip") or "") or None

    peer_key = f"{collector}:{peer_as or 'peer'}"

    current_net = ipaddress.ip_network(norm_prefix, strict=False)
    metadata_json = json.dumps(raw_metadata or {}, sort_keys=True)

    generated_alerts: List[Dict[str, Any]] = []
    history_transitions: List[Dict[str, Any]] = []

    with db_session(db_path) as conn:
        # Fetch current baselines (including candidate status and peer tracking)
        all_baselines = [
            dict(r)
            for r in conn.execute(
                "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, "
                "COALESCE(status, 'PROMOTED') as status, "
                "COALESCE(distinct_peers, '[]') as distinct_peers, "
                "COALESCE(peer_count, 1) as peer_count FROM baselines;"
            ).fetchall()
        ]

        baseline_map = {b["prefix"]: b for b in all_baselines}
        existing_baseline = baseline_map.get(norm_prefix)

        # Multi-source Peer & Collector Corroboration Query
        corroboration = conn.execute(
            "SELECT COUNT(DISTINCT collector) as collector_count, "
            "COUNT(DISTINCT COALESCE(peer_as, collector)) as peer_count, "
            "COUNT(*) as total_obs "
            "FROM observations WHERE prefix = ? AND origin_asn = ?;",
            (norm_prefix, norm_asn),
        ).fetchone()
        distinct_peers_prior = corroboration["peer_count"] if corroboration else 0
        collector_count = (corroboration["collector_count"] if corroboration else 0) + 1
        distinct_peer_count = max(distinct_peers_prior + 1, 1)
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
            elif distinct_peer_count >= 2 or collector_count >= 2:
                confidence = "HIGH"
                uncertainty_reason = f"Corroborated across {distinct_peer_count} distinct BGP peers/sources. Widespread global propagation observed."
            else:
                confidence = "MEDIUM"
                uncertainty_reason = f"Single-peer observation from AS{peer_as or 'unknown'}. Awaiting broader peer corroboration."

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
                "active_peers": [peer_as] if peer_as else [],
                "withdrawn_peers": [],
                "recovery_status": "UNCONFIRMED",
                "evidence": {
                    "id": evidence_id,
                    "record": ev_record,
                    "hash": ev_hash,
                },
            }
            generated_alerts.append(alert_obj)

            # Record rejected anomaly attempt against baseline in immutable history
            history_transitions.append({
                "prefix": norm_prefix,
                "origin_asn": norm_asn,
                "prior_status": None,
                "new_status": "REJECTED",
                "transition_type": "REJECTED_ATTEMPT",
                "reason": (
                    f"Rejected anomalous more-specific prefix {norm_prefix} (Origin: {norm_asn}) "
                    f"conflicting with parent baseline {parent_prefix} (Origin: {parent_asn}); baseline preserved unpoisoned."
                ),
                "peer_count": distinct_peer_count,
                "observation_count": 1,
            })

        # B. Check Origin-AS Change or Evaluate Candidate Baseline Policy
        if generated_alerts:
            # CRITICAL SECURITY RULE: Anomaly detected (e.g. Subprefix Containment Anomaly).
            # Suspicious announcements MUST NOT establish or poison trusted baselines!
            pass
        elif existing_baseline is None:
            # Candidate Baseline Policy:
            # STRICT INVARIANT: Only an explicitly authorized operation (authorized_seed=True)
            # can establish an immediately PROMOTED baseline.
            # Free-form scenario strings (e.g. "seed", "baseline") or caller-supplied metadata
            # flags (e.g. "trusted_seed") MUST NEVER grant immediate baseline trust.
            # Untrusted observations are always quarantined as CANDIDATE.
            is_explicit_seed = bool(authorized_seed)
            init_status = "PROMOTED" if is_explicit_seed else "CANDIDATE"
            peer_list = [peer_key]

            conn.execute(
                "INSERT INTO baselines (prefix, origin_asn, first_seen, last_seen, observation_count, status, distinct_peers, peer_count, updated_at) "
                "VALUES (?, ?, ?, ?, 1, ?, ?, 1, ?);",
                (norm_prefix, norm_asn, norm_time, norm_time, init_status, json.dumps(peer_list), now_utc),
            )

            history_transitions.append({
                "prefix": norm_prefix,
                "origin_asn": norm_asn,
                "prior_status": None,
                "new_status": init_status,
                "transition_type": "AUTHORIZED_SEED" if is_explicit_seed else "INITIAL_CANDIDATE",
                "reason": (
                    "Explicitly authorized baseline seed."
                    if is_explicit_seed
                    else "Discovered from observation; quarantined as candidate pending multi-peer corroboration."
                ),
                "peer_count": 1,
                "observation_count": 1,
            })
        else:
            baseline_asn = existing_baseline["origin_asn"]
            current_status = existing_baseline.get("status", "PROMOTED")

            if baseline_asn == norm_asn:
                # Same origin: update last seen & count; promote candidate only if peer diversity threshold reached
                new_count = existing_baseline["observation_count"] + 1
                try:
                    peer_list = json.loads(existing_baseline.get("distinct_peers") or "[]")
                except Exception:
                    peer_list = []
                if peer_key not in peer_list:
                    peer_list.append(peer_key)
                current_peer_count = len(peer_list)

                # Robust Peer-Diversity Promotion Invariant:
                # Requires at least 2 distinct peer/collector sources AND >= 3 observations.
                # Crucial check: Repeated announcements from a single flapping peer (peer_count == 1) remain CANDIDATE!
                PROMOTION_PEER_THRESHOLD = 2
                PROMOTION_OBS_THRESHOLD = 3
                if current_status == "PROMOTED":
                    new_status = "PROMOTED"
                elif current_peer_count >= PROMOTION_PEER_THRESHOLD and new_count >= PROMOTION_OBS_THRESHOLD:
                    new_status = "PROMOTED"
                    history_transitions.append({
                        "prefix": norm_prefix,
                        "origin_asn": norm_asn,
                        "prior_status": "CANDIDATE",
                        "new_status": "PROMOTED",
                        "transition_type": "PROMOTED_CORROBORATED",
                        "reason": (
                            f"Corroborated across {current_peer_count} distinct peers and {new_count} observations; "
                            f"promoted candidate to trusted baseline."
                        ),
                        "peer_count": current_peer_count,
                        "observation_count": new_count,
                    })
                else:
                    new_status = "CANDIDATE"

                conn.execute(
                    "UPDATE baselines SET last_seen = ?, observation_count = ?, status = ?, distinct_peers = ?, peer_count = ?, updated_at = ? "
                    "WHERE prefix = ?;",
                    (norm_time, new_count, new_status, json.dumps(peer_list), current_peer_count, now_utc, norm_prefix),
                )
            else:
                # Changed origin: DO NOT silently overwrite baseline. Generate alert!
                alert_id = f"alert-{uuid.uuid4().hex[:12]}"
                evidence_id = f"ev-{uuid.uuid4().hex[:12]}"
                severity = "HIGH"

                is_migration = bool(scenario and "migration" in scenario.lower())
                
                # Confidence & Uncertainty Assessment (Source-Aware)
                if is_migration:
                    confidence = "MEDIUM"
                    uncertainty_reason = "Flagged with migration tag; scheduled operator maintenance."
                elif distinct_peer_count >= 2 or collector_count >= 2 or existing_baseline["observation_count"] >= 5:
                    confidence = "HIGH"
                    uncertainty_reason = f"Corroborated conflict across {distinct_peer_count} distinct BGP peers against established baseline."
                else:
                    confidence = "MEDIUM"
                    uncertainty_reason = f"Single-peer observation from AS{peer_as or 'unknown'}. Corroborating across additional peers in progress."

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
                    "active_peers": [peer_as] if peer_as else [],
                    "withdrawn_peers": [],
                    "recovery_status": "UNCONFIRMED",
                    "evidence": {
                        "id": evidence_id,
                        "record": ev_record,
                        "hash": ev_hash,
                    },
                }
                generated_alerts.append(alert_obj)

                # Record rejected anomaly attempt against baseline in immutable history
                history_transitions.append({
                    "prefix": norm_prefix,
                    "origin_asn": norm_asn,
                    "prior_status": current_status,
                    "new_status": current_status,  # Baseline preserved unpoisoned
                    "transition_type": "REJECTED_ATTEMPT",
                    "reason": (
                        f"Rejected anomalous announcement (Origin: {norm_asn} vs Baseline: {baseline_asn}); "
                        f"baseline preserved unpoisoned."
                    ),
                    "peer_count": distinct_peer_count,
                    "observation_count": existing_baseline.get("observation_count", 1),
                })

        # C. Insert Observation Record
        cur = conn.execute(
            "INSERT INTO observations (prefix, origin_asn, collector, observed_at, scenario, raw_metadata, peer_as, peer_ip, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
            (norm_prefix, norm_asn, collector, norm_time, scenario, metadata_json, peer_as, peer_ip, now_utc),
        )
        obs_id = cur.lastrowid

        # Record queued baseline transitions in immutable history (Proposal D2)
        for ht in history_transitions:
            record_baseline_transition(
                conn,
                prefix=ht["prefix"],
                origin_asn=ht["origin_asn"],
                prior_status=ht["prior_status"],
                new_status=ht["new_status"],
                transition_type=ht["transition_type"],
                reason=ht["reason"],
                peer_count=ht.get("peer_count", 1),
                observation_count=ht.get("observation_count", 1),
                triggering_observation_id=obs_id,
                actor=actor,
                created_at=norm_time,
            )

        # D. Insert Alerts and Evidence Records
        for alert in generated_alerts:
            conn.execute(
                "INSERT INTO alerts (id, created_at, severity, kind, prefix, observed_asn, baseline_asn, "
                "parent_prefix, title, explanation, evidence_id, status, confidence, uncertainty_reason, collector, scenario, active_peers, withdrawn_peers, recovery_status) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
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
                    json.dumps(alert.get("active_peers", [])),
                    json.dumps(alert.get("withdrawn_peers", [])),
                    alert.get("recovery_status", "UNCONFIRMED"),
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


def process_withdrawal(
    db_path: str,
    prefix_raw: str,
    collector: str = "manual",
    peer_as: Optional[str] = None,
    peer_ip: Optional[str] = None,
    timestamp_raw: Any = None,
    scenario: Optional[str] = None,
    raw_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Process a BGP route withdrawal event and track per-peer anomaly recovery.

    Proposal & Review Alignment:
    - Ingests BGP WITHDRAWAL message and records event in observations audit table.
    - Tracks withdrawal state per peer. A single peer's withdrawal does NOT prematurely
      resolve an entire incident if other peers are still actively announcing the anomalous route.
    - If other peers still advertise the route, the alert remains ACTIVE with recovery_status 'PARTIAL'.
    - Only when all active observing peers for that alert have withdrawn does the alert transition
      to status 'RESOLVED' with recovery_status 'CONFIRMED'.
    - Transitions candidate routes to WITHDRAWN status.
    """
    norm_prefix, _ = normalize_prefix(prefix_raw)
    norm_time = normalize_timestamp(timestamp_raw)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    if raw_metadata:
        peer_as = peer_as or str(raw_metadata.get("peer_as") or "") or None
        peer_ip = peer_ip or str(raw_metadata.get("peer_ip") or "") or None

    clean_peer_as = f"AS{str(peer_as).strip().upper().replace('AS', '')}" if (peer_as and str(peer_as).strip()) else None

    meta = dict(raw_metadata or {})
    meta["update_type"] = "WITHDRAWAL"
    metadata_json = json.dumps(meta, sort_keys=True)

    resolved_alerts: List[Dict[str, Any]] = []
    unresolved_alerts: List[Dict[str, Any]] = []

    with db_session(db_path) as conn:
        # 1. Record withdrawal in observations table
        cur = conn.execute(
            "INSERT INTO observations (prefix, origin_asn, collector, observed_at, scenario, raw_metadata, peer_as, peer_ip, created_at) "
            "VALUES (?, 'WITHDRAWAL', ?, ?, ?, ?, ?, ?, ?);",
            (norm_prefix, collector, norm_time, scenario, metadata_json, peer_as, peer_ip, now_utc),
        )
        obs_id = cur.lastrowid

        # 2. Check active alerts on this prefix (Per-Peer Recovery Tracking)
        active_alerts = conn.execute(
            "SELECT id, title, kind, prefix, observed_asn, baseline_asn, "
            "COALESCE(active_peers, '[]') as active_peers, "
            "COALESCE(withdrawn_peers, '[]') as withdrawn_peers, "
            "status, recovery_status "
            "FROM alerts WHERE prefix = ? AND status = 'ACTIVE';",
            (norm_prefix,),
        ).fetchall()

        for alt in active_alerts:
            alt_id = alt["id"]
            try:
                raw_act = json.loads(alt["active_peers"] or "[]")
            except Exception:
                raw_act = []
            try:
                raw_wdr = json.loads(alt["withdrawn_peers"] or "[]")
            except Exception:
                raw_wdr = []

            # Normalize peer format to AS<digits> for deterministic set matching
            act_peers = [f"AS{str(p).strip().upper().replace('AS', '')}" for p in raw_act if str(p).strip()]
            wdr_peers = [f"AS{str(p).strip().upper().replace('AS', '')}" for p in raw_wdr if str(p).strip()]

            if not clean_peer_as:
                # INVARIANT: An unidentified peer (peer_as=None) MUST NOT be treated as proof
                # that every relevant peer has withdrawn!
                # Leaves recovery unconfirmed, alert remains ACTIVE.
                unresolved_alerts.append({
                    "alert_id": alt_id,
                    "prefix": norm_prefix,
                    "kind": alt["kind"],
                    "status": "ACTIVE",
                    "recovery_status": "UNCONFIRMED",
                    "reason": "MISSING_PEER_METADATA",
                    "remaining_active_peers": act_peers,
                })
            elif clean_peer_as in act_peers:
                # Matching peer found!
                act_peers.remove(clean_peer_as)
                if clean_peer_as not in wdr_peers:
                    wdr_peers.append(clean_peer_as)

                if len(act_peers) == 0:
                    # All observing peers for this alert have now withdrawn!
                    recovery_note = (
                        f"\n[RECOVERY]: Route withdrawal confirmed from all active observing peer(s) "
                        f"({', '.join(wdr_peers)}). Anomalous propagation has ceased; alert resolved."
                    )
                    conn.execute(
                        "UPDATE alerts SET status = 'RESOLVED', recovery_status = 'CONFIRMED', "
                        "active_peers = ?, withdrawn_peers = ?, explanation = explanation || ? WHERE id = ?;",
                        (json.dumps(act_peers), json.dumps(wdr_peers), recovery_note, alt_id),
                    )
                    resolved_alerts.append({
                        "alert_id": alt_id,
                        "prefix": norm_prefix,
                        "kind": alt["kind"],
                        "status": "RESOLVED",
                        "recovery_status": "CONFIRMED",
                        "withdrawn_peers": wdr_peers,
                    })
                else:
                    # Partial withdrawal: other peers are still announcing the anomaly
                    partial_note = (
                        f"\n[PEER_WITHDRAWAL]: Route withdrawn by peer {clean_peer_as} ({collector}). "
                        f"However, anomalous propagation remains active from peer(s): {', '.join(act_peers)}. "
                        f"Global recovery unconfirmed; alert remains active."
                    )
                    conn.execute(
                        "UPDATE alerts SET status = 'ACTIVE', recovery_status = 'PARTIAL', "
                        "active_peers = ?, withdrawn_peers = ?, explanation = explanation || ? WHERE id = ?;",
                        (json.dumps(act_peers), json.dumps(wdr_peers), partial_note, alt_id),
                    )
                    unresolved_alerts.append({
                        "alert_id": alt_id,
                        "prefix": norm_prefix,
                        "kind": alt["kind"],
                        "status": "ACTIVE",
                        "recovery_status": "PARTIAL",
                        "withdrawn_peers": wdr_peers,
                        "remaining_active_peers": act_peers,
                    })
            elif clean_peer_as in wdr_peers:
                # Duplicate withdrawal from an already withdrawn peer (Idempotent)
                unresolved_alerts.append({
                    "alert_id": alt_id,
                    "prefix": norm_prefix,
                    "kind": alt["kind"],
                    "status": "ACTIVE",
                    "recovery_status": alt["recovery_status"],
                    "reason": "DUPLICATE_WITHDRAWAL",
                    "withdrawn_peers": wdr_peers,
                    "remaining_active_peers": act_peers,
                })
            else:
                # Unrelated peer: this peer never observed or announced the anomaly
                unresolved_alerts.append({
                    "alert_id": alt_id,
                    "prefix": norm_prefix,
                    "kind": alt["kind"],
                    "status": "ACTIVE",
                    "recovery_status": alt["recovery_status"],
                    "reason": "UNRELATED_PEER",
                    "remaining_active_peers": act_peers,
                })

        # 3. If baseline was a candidate prefix, transition to WITHDRAWN and record history
        base_row = conn.execute(
            "SELECT origin_asn, status, peer_count, observation_count FROM baselines WHERE prefix = ?;",
            (norm_prefix,),
        ).fetchone()
        if base_row and base_row["status"] == "CANDIDATE":
            conn.execute(
                "UPDATE baselines SET status = 'WITHDRAWN', updated_at = ? WHERE prefix = ?;",
                (now_utc, norm_prefix),
            )
            record_baseline_transition(
                conn,
                prefix=norm_prefix,
                origin_asn=base_row["origin_asn"],
                prior_status="CANDIDATE",
                new_status="WITHDRAWN",
                transition_type="WITHDRAWN",
                reason=f"Candidate baseline withdrawn by observing peer ({clean_peer_as or 'unknown'}).",
                peer_count=base_row["peer_count"] or 1,
                observation_count=base_row["observation_count"] or 1,
                triggering_observation_id=obs_id,
                actor="PEER_WITHDRAWAL",
                created_at=norm_time,
            )

        conn.commit()

    return {
        "observation_id": obs_id,
        "prefix": norm_prefix,
        "status": "WITHDRAWN",
        "collector": collector,
        "peer_as": peer_as,
        "resolved_alerts_count": len(resolved_alerts),
        "resolved_alerts": resolved_alerts,
        "unresolved_alerts_count": len(unresolved_alerts),
        "unresolved_alerts": unresolved_alerts,
    }

