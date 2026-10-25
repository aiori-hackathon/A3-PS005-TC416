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
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS baselines (
                prefix TEXT PRIMARY KEY,
                origin_asn TEXT NOT NULL,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                observation_count INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'PROMOTED',
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
                scenario TEXT
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

            CREATE INDEX IF NOT EXISTS idx_obs_prefix_time ON observations (prefix, observed_at);
            CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_alerts_kind ON alerts (kind);
            CREATE INDEX IF NOT EXISTS idx_evidence_alert ON evidence (alert_id);
            """)

            # Safe column additions for pre-existing databases
            try:
                conn.execute("ALTER TABLE baselines ADD COLUMN status TEXT NOT NULL DEFAULT 'PROMOTED';")
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
        evidence_count = conn.execute("SELECT COUNT(*) FROM evidence;").fetchone()[0]
        signed_evidence = conn.execute(
            "SELECT COUNT(*) FROM evidence WHERE signer_status = 'SIGNED';"
        ).fetchone()[0]
        
        latest_row = conn.execute(
            "SELECT observed_at FROM observations ORDER BY id DESC LIMIT 1;"
        ).fetchone()
        latest_time = latest_row[0] if latest_row else None

    return {
        "tracked_routes": routes_count,
        "total_observations": obs_count,
        "total_alerts": alerts_count,
        "active_alerts": active_alerts,
        "total_evidence": evidence_count,
        "signed_evidence": signed_evidence,
        "latest_observation_time": latest_time,
    }


def get_all_baselines(db_path: str) -> List[Dict[str, Any]]:
    """Retrieve all current baselines for detector lookup."""
    with db_session(db_path) as conn:
        cursor = conn.execute(
            "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, updated_at "
            "FROM baselines ORDER BY prefix ASC;"
        )
        return [dict(row) for row in cursor.fetchall()]


def get_baseline_by_prefix(db_path: str, prefix: str) -> Optional[Dict[str, Any]]:
    """Lookup a single baseline by prefix."""
    with db_session(db_path) as conn:
        row = conn.execute(
            "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, updated_at "
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
                "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, updated_at "
                "FROM baselines WHERE prefix LIKE ? OR origin_asn LIKE ? "
                "ORDER BY last_seen DESC LIMIT ? OFFSET ?;",
                (pattern, pattern, limit, offset),
            )
        else:
            count = conn.execute("SELECT COUNT(*) FROM baselines;").fetchone()[0]
            cursor = conn.execute(
                "SELECT prefix, origin_asn, first_seen, last_seen, observation_count, updated_at "
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
            f"parent_prefix, title, explanation, evidence_id, status, collector, scenario "
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
            "parent_prefix, title, explanation, evidence_id, status, collector, scenario "
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
                    INSERT INTO baselines (prefix, origin_asn, first_seen, last_seen, observation_count, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(prefix) DO UPDATE SET
                        origin_asn = excluded.origin_asn,
                        last_seen = excluded.last_seen,
                        updated_at = excluded.updated_at;
                    """,
                    (prefix, asn, now_iso, now_iso, count, now_iso),
                )

