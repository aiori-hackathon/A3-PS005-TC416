"""FastAPI Application Entrypoint for HORA-Q.

Adheres to Document 07:
- Lifespan initialization: database tables initialized on startup.
- CORS middleware configured for cross-origin frontend dashboard.
- Optional background RIPE RIS Live collector task management.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from horaq.api import router as v1_router
from horaq.collector import RISLiveCollector
from horaq.config import settings
from horaq.database import init_db


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("horaq.main")

# Collector instance
collector_instance = RISLiveCollector(db_path=settings.database_path)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database schema
    logger.info(f"Initializing HORA-Q database at: {settings.database_path}")
    init_db(settings.database_path)

    # In public demo mode, auto-seed clean initial demonstration baselines if empty
    if settings.demo_mode:
        from horaq.database import get_overview_counts, seed_demonstration_baseline
        counts = get_overview_counts(settings.database_path)
        if counts["tracked_routes"] == 0:
            logger.info("Public Demo Mode: Seeding initial demonstration baseline routes...")
            seed_demonstration_baseline(settings.database_path)

    # Optional background collector
    if settings.live_collector_enabled:
        logger.info("HORAQ_LIVE_COLLECTOR is enabled. Starting RIS Live collector task...")
        await collector_instance.start()
    else:
        logger.info("HORAQ_LIVE_COLLECTOR is disabled (opt-in). Running in offline/synthetic mode.")

    yield

    # Shutdown: Clean up background tasks
    logger.info("Shutting down HORA-Q services...")
    if collector_instance.is_running:
        await collector_instance.stop()


app = FastAPI(
    title="HORA-Q API",
    description=(
        "Explainable BGP Origin and Subprefix Anomaly Monitor. "
        "AIORI-3, Track 2 Cyber Security, problem PS-005, team A3-PS005-TC416."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS (support exact origins, regex for Cloudflare Pages subdomains, or wildcard)
is_wildcard = "*" in settings.cors_origins
origin_regex = None
explicit_origins = []

for org in settings.cors_origins:
    if "*." in org or ".*" in org:
        import re
        escaped = re.escape(org).replace(r"\*\.", r"[a-zA-Z0-9-]+\.").replace(r"\.\*", r".*")
        origin_regex = f"^{escaped}$"
    elif org == "*":
        explicit_origins.append("*")
    else:
        explicit_origins.append(org)

app.add_middleware(
    CORSMiddleware,
    allow_origins=explicit_origins if explicit_origins else (["*"] if is_wildcard else []),
    allow_origin_regex=origin_regex,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level health endpoint (Document 08)
@app.get("/health")
async def root_health():
    return {
        "status": "ok",
        "service": "horaq-backend",
        "team": "A3-PS005-TC416",
        "version": "1.0.0",
        "demo_mode": settings.demo_mode,
        "evaluation_mode": "LIVE_TELEMETRY" if settings.live_collector_enabled else "SYNTHETIC_EVALUATION",
        "collector_enabled": settings.live_collector_enabled,
    }



# Include API v1 routes
app.include_router(v1_router)

# Optional: Mount compiled frontend SPA for unified all-in-one hosting
from pathlib import Path
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

for dist_candidate in [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path("/app/frontend/dist"),
    Path("/app/dist"),
]:
    if dist_candidate.exists() and (dist_candidate / "index.html").exists():
        assets_dir = dist_candidate / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")

        @app.get("/{full_path:path}")
        async def serve_spa_frontend(full_path: str):
            if (
                full_path.startswith("api/")
                or full_path == "health"
                or full_path.startswith("docs")
                or full_path.startswith("openapi.json")
            ):
                raise HTTPException(status_code=404, detail="Not Found")
            target = dist_candidate / full_path
            if target.is_file():
                return FileResponse(target)
            return FileResponse(dist_candidate / "index.html")
        break
