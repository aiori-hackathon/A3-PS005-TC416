"""Database schema, persistence, and atomic transaction helpers.

Adheres to Document 09:
- SQLite persistence for observations, baselines, alerts, and evidence.
- Deterministic schemas and indexes.
- Explicit connection closure preventing resource / file locks on Windows.
- Structured retrieval with pagination.
"""

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Dict, Generator, List, Optional, Tuple


@contextmanager
def db_session(db_path: str) -> Generator[sqlite3.Connection, None, None]:
    """Context manager that opens a connection, manages transaction, and closes it."""
    parent_dir = os.path.dirname(os.path.abspath(db_path))
    if parent_dir and not os.path.exists(parent_dir):
        os.makedirs(parent_dir, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        with conn:
            yield conn
    finally:
        conn.close()


def get_db_connection(db_path: str) -> sqlite3.Connection:
    """Open a SQLite connection configured with row factory and pragmas."""
    parent_dir = os.path.dirname(os.path.abspath(db_path))
    if parent_dir and not os.path.exists(parent_dir):
        os.makedirs(parent_dir, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db(db_path: str) -> None:
    """Initialize database tables and indexes if they do not exist."""
    parent_dir = os.path.dirname(os.path.abspath(db_path))
    if parent_dir and not os.path.exists(parent_dir):
        os.makedirs(parent_dir, exist_ok=True)
    with db_session(db_path) as conn:
        with conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prefix TEXT NOT NULL,
                origin_asn TEXT NOT NULL,
                collector TEXT NOT NULL,
                observed_at TEXT NOT NULL,
                scenario TEXT,
                raw_metadata TEXT,
                peer_as TEXT,
                peer_ip TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS baselines (
                prefix TEXT PRIMARY KEY,
                origin_asn TEXT NOT NULL,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                observation_count INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'PROMOTED',
                distinct_peers TEXT NOT NULL DEFAULT '[]',
                peer_count INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                severity TEXT NOT NULL,
                kind TEXT NOT NULL,
                prefix TEXT NOT NULL,
                observed_asn TEXT NOT NULL,
                baseline_asn TEXT,
                parent_prefix TEXT,
                title TEXT NOT NULL,
                explanation TEXT NOT NULL,
                evidence_id TEXT,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                confidence TEXT NOT NULL DEFAULT 'HIGH',
                uncertainty_reason TEXT,
                collector TEXT,
                scenario TEXT,
                active_peers TEXT NOT NULL DEFAULT '[]',
                withdrawn_peers TEXT NOT NULL DEFAULT '[]',
                recovery_status TEXT NOT NULL DEFAULT 'UNCONFIRMED'
            );

            CREATE TABLE IF NOT EXISTS evidence (
                id TEXT PRIMARY KEY,
                alert_id TEXT NOT NULL,
                schema_version TEXT NOT NULL DEFAULT '1.0.0',
                canonical_json TEXT NOT NULL,
                record_hash TEXT NOT NULL,
                algorithm TEXT DEFAULT 'NONE',
                signature TEXT,
                public_key TEXT,
                signer_status TEXT NOT NULL DEFAULT 'UNSIGNED',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS baseline_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prefix TEXT NOT NULL,
                origin_asn TEXT NOT NULL,
                prior_status TEXT,
                new_status TEXT NOT NULL,
                transition_type TEXT NOT NULL,
                reason TEXT NOT NULL,
                peer_count INTEGER NOT NULL DEFAULT 1,
                observation_count INTEGER NOT NULL DEFAULT 1,
                triggering_observation_id INTEGER,
                actor TEXT NOT NULL DEFAULT 'SYSTEM_POLICY',
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_obs_prefix_time ON observations (prefix, observed_at);
            CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_alerts_kind ON alerts (kind);
            CREATE INDEX IF NOT EXISTS idx_evidence_alert ON evidence (alert_id);
            CREATE INDEX IF NOT EXISTS idx_baseline_history_prefix ON baseline_history (prefix, created_at DESC);
            """)

            # Safe column additions for pre-existing databases
            try:
                conn.execute("ALTER TABLE baselines ADD COLUMN status TEXT NOT NULL DEFAULT 'PROMOTED';")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE baselines ADD COLUMN distinct_peers TEXT NOT NULL DEFAULT '[]';")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE baselines ADD COLUMN peer_count INTEGER NOT NULL DEFAULT 1;")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE observations ADD COLUMN peer_as TEXT;")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE observations ADD COLUMN peer_ip TEXT;")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE alerts ADD COLUMN confidence TEXT NOT NULL DEFAULT 'HIGH';")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE alerts ADD COLUMN uncertainty_reason TEXT;")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE alerts ADD COLUMN active_peers TEXT NOT NULL DEFAULT '[]';")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE alerts ADD COLUMN withdrawn_peers TEXT NOT NULL DEFAULT '[]';")
            except sqlite3.OperationalError:
                pass
            try:
                conn.execute("ALTER TABLE alerts ADD COLUMN recovery_status TEXT NOT NULL DEFAULT 'UNCONFIRMED';")
            except sqlite3.OperationalError:
                pass


def reset_database(db_path: str) -> None:
    """Clear all tables in the database (used for fresh test runs and reset scenario)."""
    with db_session(db_path) as conn:
        with conn:
            conn.execute("DELETE FROM evidence;")
            conn.execute("DELETE FROM alerts;")
            conn.execute("DELETE FROM observations;")
            conn.execute("DELETE FROM baselines;")


def get_overview_counts(db_path: str) -> Dict[str, Any]:
    """Retrieve high-level counts for the dashboard overview."""
    with db_session(db_path) as conn:
        routes_count = conn.execute("SELECT COUNT(*) FROM baselines;").fetchone()[0]
        obs_count = conn.execute("SELECT COUNT(*) FROM observations;").fetchone()[0]
        alerts_count = conn.execute("SELECT COUNT(*) FROM alerts;").fetchone()[0]
        active_alerts = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE status = 'ACTIVE';"
        ).fetchone()[0]
        resolved_alerts = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE status = 'RESOLVED';"
        ).fetchone()[0]
        acknowledged_alerts = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE status = 'ACKNOWLEDGED';"
        ).fetchone()[0]
        evidence_count = conn.execute("SELECT COUNT(*) FROM evidence;").fetchone()[0]
        signed_evidence = conn.execute(
            "SELECT COUNT(*) FROM evidence WHERE signer_status = 'SIGNED';"
        ).fetchone()[0]
        
        latest_row = conn.execute(
            "SELECT observed_at, collector FROM observations ORDER BY id DESC LIMIT 1;"
        ).fetchone()
        latest_time = latest_row[0] if latest_row else None
        latest_collector = latest_row[1] if latest_row else None

    return {
        "tracked_routes": routes_count,
        "total_observations": obs_count,
        "total_alerts": alerts_count,
        "active_alerts": active_alerts,
        "resolved_alerts": resolved_alerts,
        "acknowledged_alerts": acknowledged_alerts,
        "unresolved_alerts": active_alerts + acknowledged_alerts,
        "total_evidence": evidence_count,
        "signed_evidence": signed_evidence,
        "latest_observation_time": latest_time,
        "latest_collector": latest_collector,
    }


def list_observations(
    db_path: str,
    limit: int = 50,
    offset: int = 0,
    prefix: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    """List recorded BGP route observations with pagination and linked anomaly context."""
    with db_session(db_path) as conn:
        clauses = []
        params: List[Any] = []
        if prefix:
            clauses.append("o.prefix LIKE ?")
            params.append(f"%{prefix.strip()}%")
        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""

        count = conn.execute(
            f"SELECT COUNT(*) FROM observations o {where_sql};", params
        ).fetchone()[0]

        cursor = conn.execute(
            f"""
            SELECT 
                o.id, o.prefix, o.origin_asn, o.collector, o.observed_at, o.scenario,
                o.peer_as, o.peer_ip, o.created_at,
                b.origin_asn as baseline_asn, b.status as baseline_status,
                a.id as alert_id, a.kind as alert_kind, a.status as alert_status, a.severity as alert_severity, a.evidence_id
            FROM observations o
            LEFT JOIN baselines b ON b.prefix = o.prefix
            LEFT JOIN alerts a ON (a.prefix = o.prefix AND (a.observed_asn = o.origin_asn OR a.scenario = o.scenario))
            {where_sql}
            GROUP BY o.id
            ORDER BY o.id DESC LIMIT ? OFFSET ?;
            """,
            params + [limit, offset],
        )
        observations = [dict(row) for row in cursor.fetchall()]
        return observations, count


def get_all_baselines(db_path: str) -> List[Dict[str, Any]]:
    """Retrieve all current baselines for detector lookup."""
    with db_session(db_path) as conn:
        cursor = conn.execute(
            "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, "
            "COALESCE(status, 'PROMOTED') as status, "
            "COALESCE(peer_count, 1) as peer_count, "
            "COALESCE(distinct_peers, '[]') as distinct_peers, updated_at "
            "FROM baselines ORDER BY prefix ASC;"
        )
        return [dict(row) for row in cursor.fetchall()]


def get_baseline_by_prefix(db_path: str, prefix: str) -> Optional[Dict[str, Any]]:
    """Lookup a single baseline by prefix."""
    with db_session(db_path) as conn:
        row = conn.execute(
            "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, "
            "COALESCE(status, 'PROMOTED') as status, "
            "COALESCE(peer_count, 1) as peer_count, "
            "COALESCE(distinct_peers, '[]') as distinct_peers, updated_at "
            "FROM baselines WHERE prefix = ?;",
            (prefix,),
        ).fetchone()
        return dict(row) if row else None


def list_routes(
    db_path: str,
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    """List baseline routes with optional search filter and pagination."""
    with db_session(db_path) as conn:
        if search:
            pattern = f"%{search.strip()}%"
            count = conn.execute(
                "SELECT COUNT(*) FROM baselines WHERE prefix LIKE ? OR origin_asn LIKE ?;",
                (pattern, pattern),
            ).fetchone()[0]
            cursor = conn.execute(
                "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, "
                "COALESCE(status, 'PROMOTED') as status, "
                "COALESCE(peer_count, 1) as peer_count, "
                "COALESCE(distinct_peers, '[]') as distinct_peers, updated_at "
                "FROM baselines WHERE prefix LIKE ? OR origin_asn LIKE ? "
                "ORDER BY last_seen DESC LIMIT ? OFFSET ?;",
                (pattern, pattern, limit, offset),
            )
        else:
            count = conn.execute("SELECT COUNT(*) FROM baselines;").fetchone()[0]
            cursor = conn.execute(
                "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, "
                "COALESCE(status, 'PROMOTED') as status, "
                "COALESCE(peer_count, 1) as peer_count, "
                "COALESCE(distinct_peers, '[]') as distinct_peers, updated_at "
                "FROM baselines ORDER BY last_seen DESC LIMIT ? OFFSET ?;",
                (limit, offset),
            )
        routes = [dict(row) for row in cursor.fetchall()]
        return routes, count


def list_alerts(
    db_path: str,
    limit: int = 100,
    offset: int = 0,
    status: Optional[str] = None,
    kind: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    """List alerts with filtering and pagination."""
    with db_session(db_path) as conn:
        clauses = []
        params: List[Any] = []
        if status:
            clauses.append("status = ?")
            params.append(status.upper())
        if kind:
            clauses.append("kind = ?")
            params.append(kind.upper())

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""

        count = conn.execute(
            f"SELECT COUNT(*) FROM alerts {where_sql};", params
        ).fetchone()[0]

        cursor = conn.execute(
            f"SELECT id, created_at, severity, kind, prefix, observed_asn, baseline_asn, "
            f"parent_prefix, title, explanation, evidence_id, status, collector, scenario, "
            f"COALESCE(confidence, 'HIGH') as confidence, uncertainty_reason, "
            f"COALESCE(active_peers, '[]') as active_peers, "
            f"COALESCE(withdrawn_peers, '[]') as withdrawn_peers, "
            f"COALESCE(recovery_status, 'UNCONFIRMED') as recovery_status "
            f"FROM alerts {where_sql} ORDER BY created_at DESC LIMIT ? OFFSET ?;",
            params + [limit, offset],
        )
        alerts = [dict(row) for row in cursor.fetchall()]
        return alerts, count


def get_alert_by_id(db_path: str, alert_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an alert by its unique ID."""
    with db_session(db_path) as conn:
        row = conn.execute(
            "SELECT id, created_at, severity, kind, prefix, observed_asn, baseline_asn, "
            "parent_prefix, title, explanation, evidence_id, status, collector, scenario, "
            "COALESCE(confidence, 'HIGH') as confidence, uncertainty_reason, "
            "COALESCE(active_peers, '[]') as active_peers, "
            "COALESCE(withdrawn_peers, '[]') as withdrawn_peers, "
            "COALESCE(recovery_status, 'UNCONFIRMED') as recovery_status "
            "FROM alerts WHERE id = ?;",
            (alert_id,),
        ).fetchone()
        return dict(row) if row else None


def update_alert_status(db_path: str, alert_id: str, new_status: str) -> bool:
    """Update an alert's status (ACTIVE, ACKNOWLEDGED, RESOLVED)."""
    with db_session(db_path) as conn:
        with conn:
            res = conn.execute(
                "UPDATE alerts SET status = ? WHERE id = ?;",
                (new_status.upper(), alert_id),
            )
            return res.rowcount > 0


def list_evidence(
    db_path: str,
    limit: int = 100,
    offset: int = 0,
) -> Tuple[List[Dict[str, Any]], int]:
    """List evidence records with pagination."""
    with db_session(db_path) as conn:
        count = conn.execute("SELECT COUNT(*) FROM evidence;").fetchone()[0]
        cursor = conn.execute(
            "SELECT id, alert_id, schema_version, canonical_json, record_hash, algorithm, "
            "signature, public_key, signer_status, created_at "
            "FROM evidence ORDER BY created_at DESC LIMIT ? OFFSET ?;",
            (limit, offset),
        )
        items = []
        for row in cursor.fetchall():
            d = dict(row)
            try:
                d["record"] = json.loads(d["canonical_json"])
            except Exception:
                d["record"] = {}
            items.append(d)
        return items, count


def get_evidence_by_id(db_path: str, evidence_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an evidence record by evidence ID."""
    with db_session(db_path) as conn:
        row = conn.execute(
            "SELECT id, alert_id, schema_version, canonical_json, record_hash, algorithm, "
            "signature, public_key, signer_status, created_at "
            "FROM evidence WHERE id = ?;",
            (evidence_id,),
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        try:
            d["record"] = json.loads(d["canonical_json"])
        except Exception:
            d["record"] = {}
        return d


def get_evidence_by_alert_id(db_path: str, alert_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve evidence record associated with an alert."""
    with db_session(db_path) as conn:
        row = conn.execute(
            "SELECT id, alert_id, schema_version, canonical_json, record_hash, algorithm, "
            "signature, public_key, signer_status, created_at "
            "FROM evidence WHERE alert_id = ?;",
            (alert_id,),
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        try:
            d["record"] = json.loads(d["canonical_json"])
        except Exception:
            d["record"] = {}
        return d


def update_evidence_signature(
    db_path: str,
    evidence_id: str,
    algorithm: str,
    signature: str,
    public_key: str,
    signer_status: str,
) -> bool:
    """Save signature data to an evidence record."""
    with db_session(db_path) as conn:
        with conn:
            res = conn.execute(
                "UPDATE evidence SET algorithm = ?, signature = ?, public_key = ?, signer_status = ? "
                "WHERE id = ?;",
                (algorithm, signature, public_key, signer_status, evidence_id),
            )
            return res.rowcount > 0


def seed_demonstration_baseline(db_path: str) -> None:
    """Seed clean reference baseline routes for the demonstration suite."""
    now_iso = datetime.now(timezone.utc).isoformat()
    baselines_to_seed = [
        ("192.0.2.0/24", "AS64496", 10),
        ("198.51.100.0/24", "AS64497", 5),
        ("203.0.113.0/24", "AS64500", 8),
        ("2001:db8::/32", "AS64500", 12),
    ]
    with db_session(db_path) as conn:
        with conn:
            for prefix, asn, count in baselines_to_seed:
                conn.execute(
                    """
                    INSERT INTO baselines (prefix, origin_asn, first_seen, last_seen, observation_count, status, peer_count, updated_at)
                    VALUES (?, ?, ?, ?, ?, 'PROMOTED', 2, ?)
                    ON CONFLICT(prefix) DO UPDATE SET
                        origin_asn = excluded.origin_asn,
                        last_seen = excluded.last_seen,
                        status = 'PROMOTED',
                        peer_count = 2,
                        updated_at = excluded.updated_at;
                    """,
                    (prefix, asn, now_iso, now_iso, count, now_iso),
                )
                record_baseline_transition(
                    conn,
                    prefix=prefix,
                    origin_asn=asn,
                    prior_status=None,
                    new_status="PROMOTED",
                    transition_type="AUTHORIZED_SEED",
                    reason="Demonstration suite authorized reference baseline initialization",
                    peer_count=2,
                    observation_count=count,
                    actor="DEMO_SEED_INIT",
                    created_at=now_iso,
                )


def record_baseline_transition(
    conn: sqlite3.Connection,
    prefix: str,
    origin_asn: str,
    prior_status: Optional[str],
    new_status: str,
    transition_type: str,
    reason: str,
    peer_count: int = 1,
    observation_count: int = 1,
    triggering_observation_id: Optional[int] = None,
    actor: str = "SYSTEM_POLICY",
    created_at: Optional[str] = None,
) -> int:
    """Record an append-only baseline history transition (Proposal D2: Versioned baseline)."""
    ts = created_at or datetime.now(timezone.utc).isoformat()
    cursor = conn.execute(
        """
        INSERT INTO baseline_history (
            prefix, origin_asn, prior_status, new_status, transition_type,
            reason, peer_count, observation_count, triggering_observation_id,
            actor, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (
            prefix,
            origin_asn,
            prior_status,
            new_status,
            transition_type,
            reason,
            peer_count,
            observation_count,
            triggering_observation_id,
            actor,
            ts,
        ),
    )
    return cursor.lastrowid or 0


def list_baseline_history(
    db_path: str,
    prefix: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[Dict[str, Any]], int]:
    """Retrieve immutable baseline version history with optional prefix filter."""
    with db_session(db_path) as conn:
        if prefix:
            total = conn.execute(
                "SELECT COUNT(*) as count FROM baseline_history WHERE prefix = ?;", (prefix,)
            ).fetchone()["count"]
            rows = conn.execute(
                """
                SELECT id, prefix, origin_asn, prior_status, new_status, transition_type,
                       reason, peer_count, observation_count, triggering_observation_id,
                       actor, created_at
                FROM baseline_history
                WHERE prefix = ?
                ORDER BY created_at DESC, id DESC
                LIMIT ? OFFSET ?;
                """,
                (prefix, limit, offset),
            ).fetchall()
        else:
            total = conn.execute("SELECT COUNT(*) as count FROM baseline_history;").fetchone()["count"]
            rows = conn.execute(
                """
                SELECT id, prefix, origin_asn, prior_status, new_status, transition_type,
                       reason, peer_count, observation_count, triggering_observation_id,
                       actor, created_at
                FROM baseline_history
                ORDER BY created_at DESC, id DESC
                LIMIT ? OFFSET ?;
                """,
                (limit, offset),
            ).fetchall()
        return [dict(r) for r in rows], total


