"""FastAPI HTTP API router for HORA-Q.

Adheres strictly to Document 08:
- Base path: /api/v1
- Complete typed input validation using Pydantic
- Endpoints: health, overview, routes, alerts, observations, scenarios, evidence, crypto, rpki, collector
- Clear status codes and explicit error handling
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException, Query, status
from pydantic import BaseModel, Field

from horaq.config import settings
from horaq.crypto import (
    ALGORITHM_NAME,
    get_authority_key_fingerprint,
    get_authority_public_key,
    get_crypto_status,
    is_mldsa_available,
    sign_data,
    verify_signature,
)
from horaq.database import (
    get_alert_by_id,
    db_session,
    get_evidence_by_alert_id,
    get_evidence_by_id,
    get_overview_counts,
    get_baseline_by_prefix,
    list_alerts,
    list_baseline_history,
    list_evidence,
    list_routes,
    reset_database,
    seed_demonstration_baseline,
    update_alert_status,
    update_evidence_signature,
)
from horaq.detection import process_observation, process_withdrawal
from horaq.evidence import canonicalize_json, verify_evidence_hash
from horaq.rpki import check_rpki_origin_validation



router = APIRouter(prefix="/api/v1")


# -----------------------------------------------------------------------------
# Request & Response Models
# -----------------------------------------------------------------------------

class ObservationRequest(BaseModel):
    prefix: str = Field(..., description="IPv4 or IPv6 CIDR prefix (e.g. 192.0.2.0/24)")
    origin_asn: Any = Field(..., description="Autonomous System Number (e.g. 13335 or 'AS13335')")
    collector: Optional[str] = Field("manual", description="Observation collector / provenance label")
    timestamp: Optional[str] = Field(None, description="ISO 8601 observation timestamp (defaults to UTC now)")
    scenario: Optional[str] = Field(None, description="Optional synthetic scenario identifier")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary route context")


class BaselineSeedRequest(BaseModel):
    prefix: str = Field(..., description="IPv4 or IPv6 CIDR prefix (e.g. 192.0.2.0/24)")
    origin_asn: Any = Field(..., description="Autonomous System Number (e.g. 13335 or 'AS13335')")
    collector: Optional[str] = Field("authorized-seed", description="Observation collector / authority label")
    timestamp: Optional[str] = Field(None, description="ISO 8601 observation timestamp (defaults to UTC now)")
    reason: Optional[str] = Field("Authorized initial baseline seed", description="Operational justification")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary baseline context")


class WithdrawalRequest(BaseModel):
    prefix: str = Field(..., description="IPv4 or IPv6 CIDR prefix being withdrawn")
    peer_as: Optional[Any] = Field(None, description="Observing peer AS that sent the withdrawal (e.g. 64500 or 'AS64500')")
    peer_ip: Optional[str] = Field(None, description="Peer BGP IP address")
    collector: Optional[str] = Field("manual", description="Observation collector / provenance label")
    timestamp: Optional[str] = Field(None, description="ISO 8601 timestamp (defaults to UTC now)")
    scenario: Optional[str] = Field(None, description="Optional scenario identifier")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary context metadata")


class AlertStatusUpdate(BaseModel):
    status: str = Field(..., description="New alert status: ACTIVE, ACKNOWLEDGED, RESOLVED")


class HashVerifyRequest(BaseModel):
    record: Dict[str, Any] = Field(..., description="Canonical evidence dictionary")
    expected_hash: str = Field(..., description="Expected SHA-256 hex digest")


class SignatureVerifyRequest(BaseModel):
    record: Dict[str, Any] = Field(..., description="Canonical evidence dictionary")
    signature: str = Field(..., description="Base64-encoded ML-DSA-65 signature")
    public_key: str = Field(..., description="Base64-encoded ML-DSA-65 public key")


# -----------------------------------------------------------------------------
# Core Endpoints
# -----------------------------------------------------------------------------

@router.get("/health")
async def get_health() -> Dict[str, Any]:
    """Health confirmation endpoint."""
    return {
        "status": "ok",
        "service": "horaq-backend",
        "team": "A3-PS005-TC416",
        "version": "1.0.0",
        "demo_mode": settings.demo_mode,
        "evaluation_mode": "LIVE_TELEMETRY" if settings.live_collector_enabled else "SYNTHETIC_EVALUATION",
        "collector_enabled": settings.live_collector_enabled,
    }


@router.get("/overview")
async def get_overview() -> Dict[str, Any]:
    """Return dashboard summary metrics."""
    counts = get_overview_counts(settings.database_path)
    crypto_st = get_crypto_status()
    from horaq.collector import get_collector_telemetry
    collector_st = get_collector_telemetry()
    return {
        **counts,
        "crypto_status": crypto_st,
        "collector_status": collector_st,
        "database": settings.database_path,
        "demo_mode": settings.demo_mode,
        "evaluation_mode": "LIVE_TELEMETRY" if settings.live_collector_enabled else "SYNTHETIC_EVALUATION",
    }



@router.get("/collector/status")
async def get_collector_status() -> Dict[str, Any]:
    """Return operational telemetry of the RIPE RIS Live collector."""
    from horaq.collector import get_collector_telemetry
    return get_collector_telemetry()



@router.get("/routes")
async def get_routes(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """Retrieve stored baseline routes with pagination and optional search."""
    items, total = list_routes(settings.database_path, limit=limit, offset=offset, search=search)
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/baselines/history")
async def get_baselines_history_endpoint(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    prefix: Optional[str] = Query(None, description="Optional prefix filter"),
) -> Dict[str, Any]:
    """Retrieve immutable baseline version history and transition decisions (Proposal D2)."""
    items, total = list_baseline_history(
        settings.database_path,
        prefix=prefix,
        limit=limit,
        offset=offset,
    )
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "prefix_filter": prefix,
    }


@router.get("/routes/{prefix:path}/history")
async def get_route_history_endpoint(
    prefix: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> Dict[str, Any]:
    """Retrieve versioned transition history for a specific route prefix."""
    items, total = list_baseline_history(
        settings.database_path,
        prefix=prefix,
        limit=limit,
        offset=offset,
    )
    return {
        "prefix": prefix,
        "history": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.post("/baselines/seed", status_code=status.HTTP_201_CREATED)
async def seed_authorized_baseline_endpoint(
    req: BaselineSeedRequest,
    authorization: Optional[str] = Header(None),
    x_admin_token: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Explicitly authorize and seed a trusted baseline route (Proposal D2/Versioned Baseline).

    Strict Security Invariant:
    Only this explicit endpoint (protected by authentication in demo mode) can establish
    an immediately PROMOTED baseline. Wild route observations are always quarantined as CANDIDATE.
    """
    if settings.demo_mode:
        token = x_admin_token or (authorization.replace("Bearer ", "") if authorization else "")
        if not settings.admin_token or token != settings.admin_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authorized baseline seeding requires administrator credentials in Demo Mode.",
            )
    actor = "OPERATOR_ADMIN" if (x_admin_token or authorization) else "OPERATOR"
    try:
        res = process_observation(
            db_path=settings.database_path,
            prefix_raw=req.prefix,
            origin_asn_raw=req.origin_asn,
            collector=req.collector or "authorized-seed",
            timestamp_raw=req.timestamp,
            scenario="authorized-baseline-seed",
            raw_metadata=req.metadata,
            authorized_seed=True,
            actor=actor,
        )
        return {
            "message": f"Prefix '{req.prefix}' successfully established as authorized PROMOTED baseline.",
            "prefix": req.prefix,
            "origin_asn": req.origin_asn,
            "status": "PROMOTED",
            "actor": actor,
            "result": res,
        }
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )


@router.get("/alerts")
async def get_alerts(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    kind: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """Retrieve detected anomaly alerts with filtering and pagination."""
    items, total = list_alerts(
        settings.database_path,
        limit=limit,
        offset=offset,
        status=status,
        kind=kind,
    )
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/alerts/{alert_id}")
async def get_alert_detail(alert_id: str) -> Dict[str, Any]:
    """Get complete alert details and linked evidence record."""
    alert = get_alert_by_id(settings.database_path, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found.",
        )
    evidence = get_evidence_by_alert_id(settings.database_path, alert_id)
    return {
        "alert": alert,
        "evidence": evidence,
    }


@router.patch("/alerts/{alert_id}/status")
async def patch_alert_status(alert_id: str, payload: AlertStatusUpdate) -> Dict[str, Any]:
    """Update alert lifecycle status (ACTIVE, ACKNOWLEDGED, RESOLVED)."""
    valid_statuses = ("ACTIVE", "ACKNOWLEDGED", "RESOLVED")
    new_st = payload.status.strip().upper()
    if new_st not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{payload.status}'. Must be one of: {', '.join(valid_statuses)}",
        )

    updated = update_alert_status(settings.database_path, alert_id, new_st)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found.",
        )
    return {"id": alert_id, "status": new_st, "updated": True}


@router.post("/observations", status_code=status.HTTP_201_CREATED)
async def post_observation(
    obs: ObservationRequest,
    authorization: Optional[str] = Header(None),
    x_admin_token: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Ingest a BGP route observation and execute the detection pipeline."""
    if settings.demo_mode:
        token = x_admin_token or (authorization.replace("Bearer ", "") if authorization else "")
        if not settings.admin_token or token != settings.admin_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Arbitrary route observation submission is restricted in Public Evaluator Demo Mode. "
                    "Evaluators can safely trigger the predefined synthetic test scenarios via the Scenarios view or API."
                ),
            )
    try:
        res = process_observation(
            db_path=settings.database_path,
            prefix_raw=obs.prefix,
            origin_asn_raw=obs.origin_asn,
            collector=obs.collector or "manual",
            timestamp_raw=obs.timestamp,
            scenario=obs.scenario,
            raw_metadata=obs.metadata,
            authorized_seed=False,
            actor="API_OBSERVATION",
        )
        return res
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )


@router.post("/withdrawals", status_code=status.HTTP_200_OK)
async def post_withdrawal_endpoint(withdrawal: WithdrawalRequest) -> Dict[str, Any]:
    """Ingest a BGP route withdrawal event and track per-peer anomaly recovery (Proposal D3)."""
    try:
        res = process_withdrawal(
            db_path=settings.database_path,
            prefix_raw=withdrawal.prefix,
            collector=withdrawal.collector or "api",
            peer_as=str(withdrawal.peer_as) if withdrawal.peer_as is not None else None,
            peer_ip=withdrawal.peer_ip,
            timestamp_raw=withdrawal.timestamp,
            scenario=withdrawal.scenario or "api-withdrawal",
            raw_metadata=withdrawal.metadata,
        )
        return {
            "message": f"Processed BGP withdrawal for {withdrawal.prefix}",
            "prefix": withdrawal.prefix,
            "resolved_alerts": res.get("resolved_alerts", []),
            "unresolved_alerts": res.get("unresolved_alerts", []),
            "recovered_candidate_routes": res.get("recovered_candidate_routes", 0),
            "result": res,
        }
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )


@router.get("/evidence")
async def get_all_evidence(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> Dict[str, Any]:
    """List stored evidence records."""
    items, total = list_evidence(settings.database_path, limit=limit, offset=offset)
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/evidence/{evidence_id}")
async def get_evidence_item(evidence_id: str) -> Dict[str, Any]:
    """Retrieve an evidence record by its evidence ID."""
    ev = get_evidence_by_id(settings.database_path, evidence_id)
    if not ev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence record '{evidence_id}' not found.",
        )
    return ev


@router.post("/evidence/{evidence_id}/sign")
async def sign_evidence_endpoint(evidence_id: str) -> Dict[str, Any]:
    """Sign an evidence record using ML-DSA-65.

    Strict specification: Fails clearly if ML-DSA provider is unavailable.
    Never silently substitutes a different algorithm.
    """
    if not is_mldsa_available():
        status_info = get_crypto_status()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "ML-DSA provider unavailable",
                "algorithm": ALGORITHM_NAME,
                "message": status_info["message"],
                "notice": "Per HORA-Q specification, fallback to classical algorithms is strictly prohibited.",
            },
        )

    ev = get_evidence_by_id(settings.database_path, evidence_id)
    if not ev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence record '{evidence_id}' not found.",
        )

    record_dict = ev.get("record", {})
    canon_bytes = canonicalize_json(record_dict)

    sig_b64, pub_b64 = sign_data(canon_bytes)
    update_evidence_signature(
        db_path=settings.database_path,
        evidence_id=evidence_id,
        algorithm=ALGORITHM_NAME,
        signature=sig_b64,
        public_key=pub_b64,
        signer_status="SIGNED",
    )

    return {
        "evidence_id": evidence_id,
        "algorithm": ALGORITHM_NAME,
        "signature": sig_b64,
        "public_key": pub_b64,
        "signer_status": "SIGNED",
    }


@router.post("/evidence/verify-hash")
async def verify_hash_endpoint(payload: HashVerifyRequest) -> Dict[str, Any]:
    """Verify SHA-256 integrity digest of canonical evidence JSON."""
    is_valid, computed = verify_evidence_hash(payload.record, payload.expected_hash)
    return {
        "valid": is_valid,
        "computed_hash": computed,
        "expected_hash": payload.expected_hash,
        "algorithm": "SHA-256",
        "integrity_verified": is_valid,
    }


@router.post("/evidence/verify")
async def verify_signature_endpoint(payload: SignatureVerifyRequest) -> Dict[str, Any]:
    """Verify ML-DSA-65 post-quantum digital signature on evidence record."""
    if not is_mldsa_available():
        status_info = get_crypto_status()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "ML-DSA provider unavailable",
                "algorithm": ALGORITHM_NAME,
                "message": status_info["message"],
            },
        )

    canon_bytes = canonicalize_json(payload.record)
    try:
        valid = verify_signature(
            canon_bytes,
            payload.signature,
            payload.public_key,
        )
        return {
            "valid": valid,
            "algorithm": ALGORITHM_NAME,
            "signer_authenticated": valid,
        }
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )


@router.get("/crypto/status")
async def get_crypto_status_endpoint() -> Dict[str, Any]:
    """Report availability of ML-DSA-65 post-quantum signature engine and authority key."""
    return get_crypto_status()


@router.get("/crypto/public-key")
async def get_crypto_public_key_endpoint() -> Dict[str, Any]:
    """Retrieve the persistent ML-DSA-65 authority public key and fingerprint."""
    if not is_mldsa_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML-DSA-65 provider unavailable.",
        )
    return {
        "algorithm": ALGORITHM_NAME,
        "public_key": get_authority_public_key(),
        "fingerprint": get_authority_key_fingerprint(),
        "key_lifecycle": "PERSISTENT_AUTHORITY_KEY",
        "format": "BASE64_RAW_BYTES",
    }


@router.get("/rpki/validate")
async def get_rpki_validation(
    prefix: str = Query(..., description="CIDR prefix to validate"),
    asn: str = Query(..., description="Origin ASN to validate"),
) -> Dict[str, Any]:
    """Query live RPKI origin-validation status from RIPEstat."""
    res = await check_rpki_origin_validation(prefix=prefix, asn=asn)
    return res


# -----------------------------------------------------------------------------
# Scenarios Controls
# -----------------------------------------------------------------------------

@router.post("/scenarios/{scenario_name}")
async def run_scenario_endpoint(
    scenario_name: str,
    authorization: Optional[str] = Header(None),
    x_admin_token: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Execute reproducible synthetic test scenarios per Document 21."""
    s_name = scenario_name.strip().lower().replace("_", "-")

    if s_name in ("reset", "clear"):
        if settings.demo_mode:
            token = x_admin_token or (authorization.replace("Bearer ", "") if authorization else "")
            if settings.admin_token and token == settings.admin_token:
                reset_database(settings.database_path)
                msg = "Database fully purged by authorized administrator."
            else:
                # Safe demonstration reset: clear scenario alerts and observations while re-seeding baseline
                with db_session(settings.database_path) as conn:
                    with conn:
                        conn.execute("DELETE FROM alerts;")
                        conn.execute("DELETE FROM evidence;")
                        conn.execute("DELETE FROM observations WHERE scenario IS NOT NULL;")
                seed_demonstration_baseline(settings.database_path)
                msg = "Demonstration state safely reset to prepared baseline. Destructive total database wipe is restricted in Public Evaluation Demo Mode."
            return {
                "scenario": "reset",
                "message": msg,
                "success": True,
                "alerts_generated": 0,
                "expected_alerts": 0,
                "demo_mode": settings.demo_mode,
            }
        else:
            reset_database(settings.database_path)
            return {
                "scenario": "reset",
                "message": "Database cleared. Ready for fresh test run.",
                "success": True,
                "alerts_generated": 0,
                "expected_alerts": 0,
                "demo_mode": False,
            }


    if s_name in ("baseline", "scenario-1-baseline", "1-baseline"):
        # Seeding baseline scenario: 192.0.2.0/24 with AS64496
        # Expected: Baseline created, 0 alerts.
        res = process_observation(
            db_path=settings.database_path,
            prefix_raw="192.0.2.0/24",
            origin_asn_raw=64496,
            collector="synthetic-runner",
            scenario="baseline",
            raw_metadata={"description": "Baseline establishment for TEST-NET-1"},
            authorized_seed=True,
            actor="SCENARIO_RUNNER",
        )
        return {
            "scenario": "baseline",
            "description": "Seeded initial baseline route 192.0.2.0/24 originating from AS64496",
            "alerts_generated": res["alerts_count"],
            "expected_alerts": 0,
            "success": res["alerts_count"] == 0,
            "result": res,
        }

    if s_name in ("origin-change", "scenario-2-origin-conflict", "origin-conflict", "2-origin-conflict"):
        # Origin change scenario: 192.0.2.0/24 with AS64511 (different from baseline AS64496)
        existing = get_baseline_by_prefix(settings.database_path, "192.0.2.0/24")
        if not existing or existing.get("origin_asn") != "AS64496":
            with db_session(settings.database_path) as conn:
                conn.execute("DELETE FROM baselines WHERE prefix = '192.0.2.0/24';")
            process_observation(
                db_path=settings.database_path,
                prefix_raw="192.0.2.0/24",
                origin_asn_raw=64496,
                collector="synthetic-runner",
                scenario="baseline",
                raw_metadata={"description": "Baseline establishment for TEST-NET-1"},
                authorized_seed=True,
                actor="SCENARIO_RUNNER",
            )

        res = process_observation(
            db_path=settings.database_path,
            prefix_raw="192.0.2.0/24",
            origin_asn_raw=64511,
            peer_as="AS64511",
            collector="synthetic-runner",
            scenario="origin-change",
            raw_metadata={"description": "Unexpected origin ASN announced for TEST-NET-1", "peer_as": "AS64511"},
        )
        return {
            "scenario": "origin-change",
            "description": "Observed origin change for 192.0.2.0/24 from AS64496 to AS64511",
            "alerts_generated": res["alerts_count"],
            "expected_alerts": 1,
            "success": res["alerts_count"] == 1,
            "result": res,
        }

    if s_name in ("subprefix", "scenario-3-subprefix", "3-subprefix"):
        # Subprefix scenario: 192.0.2.128/25 (strict subnet of 192.0.2.0/24) with AS64500
        existing = get_baseline_by_prefix(settings.database_path, "192.0.2.0/24")
        if not existing or existing.get("origin_asn") != "AS64496":
            with db_session(settings.database_path) as conn:
                conn.execute("DELETE FROM baselines WHERE prefix = '192.0.2.0/24';")
            process_observation(
                db_path=settings.database_path,
                prefix_raw="192.0.2.0/24",
                origin_asn_raw=64496,
                collector="synthetic-runner",
                scenario="baseline",
                raw_metadata={"description": "Baseline establishment for TEST-NET-1"},
                authorized_seed=True,
                actor="SCENARIO_RUNNER",
            )

        res = process_observation(
            db_path=settings.database_path,
            prefix_raw="192.0.2.128/25",
            origin_asn_raw=64500,
            peer_as="AS64500",
            collector="synthetic-runner",
            scenario="subprefix",
            raw_metadata={"description": "More-specific announcement /25 under /24", "peer_as": "AS64500"},
        )
        return {
            "scenario": "subprefix",
            "description": "Announced more-specific subnet 192.0.2.128/25 under tracked parent 192.0.2.0/24",
            "alerts_generated": res["alerts_count"],
            "expected_alerts": 1,
            "success": res["alerts_count"] == 1,
            "result": res,
        }

    if s_name in ("legitimate-migration", "scenario-4-traffic-shift", "traffic-shift", "4-traffic-shift"):
        # Legitimate migration scenario: 198.51.100.0/24 seeded under AS64497, then announced under AS64498
        # Detector flags origin change with explainability noting migration label
        r1 = process_observation(
            db_path=settings.database_path,
            prefix_raw="198.51.100.0/24",
            origin_asn_raw=64497,
            collector="synthetic-runner",
            scenario="migration-seed",
            authorized_seed=True,
            actor="SCENARIO_RUNNER",
        )
        r2 = process_observation(
            db_path=settings.database_path,
            prefix_raw="198.51.100.0/24",
            origin_asn_raw=64498,
            peer_as="AS64498",
            collector="synthetic-runner",
            scenario="legitimate-migration",
            raw_metadata={"change_ticket": "CHG-2026-9921", "approved_by": "NetOps", "peer_as": "AS64498"},
        )
        return {
            "scenario": "legitimate-migration",
            "description": "Seeded 198.51.100.0/24 at AS64497, then transitioned to AS64498 with migration tag",
            "alerts_generated": r2["alerts_count"],
            "expected_alerts": 1,
            "success": r2["alerts_count"] == 1,
            "result": r2,
        }

    if s_name in ("ipv6-subprefix", "scenario-5-multi-homing", "5-multi-homing", "ipv6"):
        # IPv6 subprefix: 2001:db8::/32 seeded under AS64496, then 2001:db8:1::/48 announced under AS64505
        r1 = process_observation(
            db_path=settings.database_path,
            prefix_raw="2001:db8::/32",
            origin_asn_raw=64496,
            collector="synthetic-runner",
            scenario="ipv6-parent-seed",
            authorized_seed=True,
            actor="SCENARIO_RUNNER",
        )
        r2 = process_observation(
            db_path=settings.database_path,
            prefix_raw="2001:db8:1::/48",
            origin_asn_raw=64505,
            peer_as="AS64505",
            collector="synthetic-runner",
            scenario="ipv6-subprefix",
            raw_metadata={"peer_as": "AS64505"},
        )
        return {
            "scenario": "ipv6-subprefix",
            "description": "Seeded IPv6 2001:db8::/32, then announced child 2001:db8:1::/48",
            "alerts_generated": r2["alerts_count"],
            "expected_alerts": 1,
            "success": r2["alerts_count"] == 1,
            "result": r2,
        }

    if s_name in ("withdrawal-recovery", "recovery", "scenario-6-recovery", "6-recovery"):
        # Stage 6: BGP Route Withdrawal & Anomaly Recovery Demonstration (Proposal D3)
        # Identifies active anomaly alert, sends matching BGP withdrawal from observing peer,
        # and proves per-peer transition to RESOLVED status and candidate route marked WITHDRAWN.
        active_items, _ = list_alerts(settings.database_path, limit=10, status="ACTIVE")
        target_prefix = None
        target_peer = None

        if active_items:
            cand = active_items[0]
            target_prefix = cand["prefix"]
            raw_peers = cand.get("active_peers") or []
            if isinstance(raw_peers, str):
                import json
                try:
                    raw_peers = json.loads(raw_peers)
                except Exception:
                    raw_peers = []
            if raw_peers and len(raw_peers) > 0:
                target_peer = raw_peers[0]
            else:
                target_peer = cand.get("observed_asn")
        else:
            # Seed clean baseline and inject a test subprefix anomaly if no alert currently active
            existing = get_baseline_by_prefix(settings.database_path, "192.0.2.0/24")
            if not existing or existing.get("origin_asn") != "AS64496":
                process_observation(
                    db_path=settings.database_path,
                    prefix_raw="192.0.2.0/24",
                    origin_asn_raw=64496,
                    collector="synthetic-runner",
                    scenario="baseline",
                    authorized_seed=True,
                    actor="SCENARIO_RUNNER",
                )
            process_observation(
                db_path=settings.database_path,
                prefix_raw="192.0.2.128/25",
                origin_asn_raw=64500,
                peer_as="AS64500",
                collector="synthetic-runner",
                scenario="subprefix",
                raw_metadata={"peer_as": "AS64500"},
            )
            target_prefix = "192.0.2.128/25"
            target_peer = "AS64500"

        w_res = process_withdrawal(
            db_path=settings.database_path,
            prefix_raw=target_prefix,
            peer_as=target_peer,
            collector="synthetic-runner",
            scenario="withdrawal-recovery",
        )
        resolved_count = len(w_res.get("resolved_alerts", []))
        return {
            "scenario": "withdrawal-recovery",
            "description": f"Processed BGP route withdrawal for {target_prefix} from peer {target_peer}; anomaly recovery confirmed.",
            "prefix": target_prefix,
            "peer_as": target_peer,
            "alerts_resolved": resolved_count,
            "alerts_generated": 0,
            "expected_alerts": 0,
            "success": resolved_count > 0 or w_res.get("recovered_candidate_routes", 0) > 0,
            "result": w_res,
        }

    if s_name in ("run-all", "all", "suite", "master"):
        # Run all test scenarios sequentially
        results = []
        total_alerts = 0
        expected_total = 0

        for sc in ("baseline", "origin-change", "subprefix", "legitimate-migration", "ipv6-subprefix"):
            sc_res = await run_scenario_endpoint(sc)
            results.append(sc_res)
            total_alerts += sc_res.get("alerts_generated", 0)
            expected_total += sc_res.get("expected_alerts", 0)

        all_passed = (len(results) == 5) and all(sc.get("success") is True for sc in results)
        return {
            "scenario": "run-all",
            "description": "Executed complete AIORI-3 benchmark suite (5 scenarios)",
            "alerts_generated": total_alerts,
            "expected_alerts": expected_total,
            "suite_results": results,
            "success": all_passed and (total_alerts == expected_total),
        }

    if s_name in ("seed-demo", "seed", "demo"):
        # Reset and seed realistic demonstrator data for live presentations
        if settings.demo_mode:
            token = x_admin_token or (authorization.replace("Bearer ", "") if authorization else "")
            if settings.admin_token and token == settings.admin_token:
                reset_database(settings.database_path)
            else:
                # Safe demonstration reset: clear only scenario alerts/evidence and synthetic scenario observations,
                # strictly preserving live BGP observations and unassociated baselines.
                with db_session(settings.database_path) as conn:
                    with conn:
                        conn.execute("DELETE FROM evidence WHERE alert_id IN (SELECT id FROM alerts WHERE scenario IS NOT NULL OR scenario LIKE 'demo-%');")
                        conn.execute("DELETE FROM alerts WHERE scenario IS NOT NULL OR scenario LIKE 'demo-%';")
                        conn.execute("DELETE FROM observations WHERE scenario IS NOT NULL;")
        else:
            reset_database(settings.database_path)

        # 1. Establish trusted reference baseline roots
        b1 = process_observation(db_path=settings.database_path, prefix_raw="1.1.1.0/24", origin_asn_raw=13335, collector="rrc00", scenario="demo-seed", authorized_seed=True, actor="DEMO_SEED_INIT")
        b2 = process_observation(db_path=settings.database_path, prefix_raw="8.8.8.0/24", origin_asn_raw=15169, collector="rrc00", scenario="demo-seed", authorized_seed=True, actor="DEMO_SEED_INIT")
        b3 = process_observation(db_path=settings.database_path, prefix_raw="9.9.9.0/24", origin_asn_raw=19281, collector="rrc01", scenario="demo-seed", authorized_seed=True, actor="DEMO_SEED_INIT")
        b4 = process_observation(db_path=settings.database_path, prefix_raw="2001:db8::/32", origin_asn_raw=64496, collector="rrc00", scenario="demo-seed", authorized_seed=True, actor="DEMO_SEED_INIT")
        b5 = process_observation(db_path=settings.database_path, prefix_raw="192.0.2.0/24", origin_asn_raw=64496, collector="rrc00", scenario="demo-seed", authorized_seed=True, actor="DEMO_SEED_INIT")
        b6 = process_observation(db_path=settings.database_path, prefix_raw="198.51.100.0/24", origin_asn_raw=64497, collector="rrc00", scenario="demo-seed", authorized_seed=True, actor="DEMO_SEED_INIT")
        b7 = process_observation(db_path=settings.database_path, prefix_raw="203.0.113.0/24", origin_asn_raw=64499, collector="rrc00", scenario="demo-seed", authorized_seed=True, actor="DEMO_SEED_INIT")

        # 2. Inject Origin Conflict Incident (Baseline preserved, alert generated)
        a1 = process_observation(db_path=settings.database_path, prefix_raw="1.1.1.0/24", origin_asn_raw=99999, peer_as="AS99999", collector="rrc00", scenario="demo-origin-conflict", raw_metadata={"peer_as": "AS99999"})
        if a1["alerts"] and is_mldsa_available():
            ev_id = a1["alerts"][0]["evidence_id"]
            ev_rec = a1["alerts"][0]["evidence"]["record"]
            canon_b = canonicalize_json(ev_rec)
            sig_b64, pub_b64 = sign_data(canon_b)
            update_evidence_signature(
                db_path=settings.database_path,
                evidence_id=ev_id,
                algorithm=ALGORITHM_NAME,
                signature=sig_b64,
                public_key=pub_b64,
                signer_status="SIGNED",
            )

        # 3. Inject Subprefix Hijack Incident (Alert generated, baseline NOT poisoned)
        a2 = process_observation(db_path=settings.database_path, prefix_raw="8.8.8.128/25", origin_asn_raw=66666, peer_as="AS66666", collector="rrc03", scenario="demo-subprefix-hijack", raw_metadata={"peer_as": "AS66666"})

        # 4. Inject IPv6 Subprefix Anomaly (Alert generated, baseline NOT poisoned)
        a3 = process_observation(db_path=settings.database_path, prefix_raw="2001:db8:1::/48", origin_asn_raw=64505, peer_as="AS64505", collector="rrc00", scenario="demo-ipv6-subprefix", raw_metadata={"peer_as": "AS64505"})

        return {
            "scenario": "seed-demo",
            "description": "Seeded 7 trusted baselines and injected 3 realistic BGP anomaly incidents (baselines preserved against poisoning)",
            "alerts_generated": a1["alerts_count"] + a2["alerts_count"] + a3["alerts_count"],
            "expected_alerts": 3,
            "success": True,
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Unknown scenario '{scenario_name}'. Available: reset, baseline, origin-change, subprefix, legitimate-migration, ipv6-subprefix, withdrawal-recovery, run-all, seed-demo",
    )

