"""
US Healthcare EDI Parser & X12 File Validator
FastAPI Application Entry Point

Merged: Phase 1 (multi-agent compliance pipeline) + Phase 2 (repair & learning)
"""
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database.connection import init_db
from routes.parse import router as parse_router
from routes.validate import router as validate_router
from routes.ai import router as ai_router
from routes.reconcile import router as reconcile_router
from routes.delta import router as delta_router

# --- Phase 1 imports (multi-agent pipeline) ---
from app.config import settings
from app.utils.logger import pipeline_logger
from app.knowledge.graph_store import graph_store
from app.knowledge.seed_neo4j import seed_neo4j_database
from app.db.postgres import engine
from app.db.postgres_models import Base

from app.routes.ingest import router as ingest_router
from app.routes.health import router as health_router
from app.routes.jobs import router as jobs_router
from app.routes.triage import router as triage_router
from app.routes.audit import router as audit_router

# --- Phase 2 imports (repair & learning) ---
from learning.db import init_db as init_feedback_db
from routes.repair import router as repair_router


# ---------------------------------------------------------------------------
# In-memory analysis result cache (Phase 2)
# TODO: Replace with Redis or a persistent store for production
# ---------------------------------------------------------------------------
_analysis_results: dict[str, dict] = {}


def store_analysis_result(document_id: str, result: dict) -> None:
    """Store an analysis/pipeline result for later use by the repair flow."""
    _analysis_results[document_id] = result


def get_analysis_result(document_id: str) -> dict | None:
    """Retrieve a stored analysis/pipeline result."""
    return _analysis_results.get(document_id)


# ---------------------------------------------------------------------------
# Startup / Shutdown lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all databases and services on startup."""
    # 1. Initialize original SQLite database
    await init_db()

    # 2. Initialize Phase 2 SQLite feedback database
    await init_feedback_db()
    pipeline_logger.info("Phase 2 feedback database initialized.")

    # 3. Initialize Phase 1 PostgreSQL tables
    pipeline_logger.info("Creating PostgreSQL database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        pipeline_logger.info("PostgreSQL database tables created successfully.")
    except Exception as e:
        pipeline_logger.error(f"Failed to create PostgreSQL database tables: {e}")

    # 4. Connect Neo4j driver and seed compliance rules
    try:
        connected = graph_store.connect()
        if connected:
            pipeline_logger.info("Seeding Neo4j native vector index rules...")
            seed_neo4j_database()
        else:
            pipeline_logger.warning("Neo4j database is offline. Seeding skipped.")
    except Exception as e:
        pipeline_logger.warning(
            f"Failed to connect or seed Neo4j database during startup: {e}"
        )

    pipeline_logger.info(
        f"IntelliFix AI ready. LLM Provider: {settings.llm_provider.upper()}"
    )

    yield

    # Shutdown logic
    pipeline_logger.info("Shutting down service...")
    try:
        graph_store.close()
    except Exception as e:
        pipeline_logger.error(f"Error closing Neo4j connection: {e}")


app = FastAPI(
    title="IntelliFix AI — Compliance Platform",
    description="Enterprise Compliance Intelligence, Triage & Repair Backend",
    version="2.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS config
# ---------------------------------------------------------------------------
def _allowed_origins() -> list[str]:
    """
    Build allowed frontend origins from env.
    Set CORS_ORIGINS as comma-separated values in production.
    Example:
      CORS_ORIGINS=https://your-frontend.onrender.com,https://your-domain.com
    """
    raw = os.getenv("CORS_ORIGINS", "")
    if raw.strip():
        return [o.strip() for o in raw.split(",") if o.strip()]
    return ["http://localhost:5173", "http://localhost:3000"]

# ---------------------------------------------------------------------------
# CORS – allow React dev server
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "code": "INTERNAL_SERVER_ERROR",
        },
    )


# ---------------------------------------------------------------------------
# Routers — Original
# ---------------------------------------------------------------------------
app.include_router(parse_router, prefix="/api", tags=["Parsing"])
app.include_router(validate_router, prefix="/api", tags=["Validation"])
app.include_router(ai_router, prefix="/api", tags=["AI Intelligence"])
app.include_router(reconcile_router, prefix="/api", tags=["Reconciliation"])
app.include_router(delta_router, prefix="/api", tags=["Delta Engine"])

# ---------------------------------------------------------------------------
# Routers — Phase 1 (multi-agent pipeline)
# ---------------------------------------------------------------------------
app.include_router(ingest_router, prefix="/api/v1", tags=["Validation Ingest"])
app.include_router(jobs_router, prefix="/api/v1", tags=["Job Operations"])
app.include_router(triage_router, prefix="/api/v1", tags=["Human-in-the-Loop Triage"])
app.include_router(audit_router, prefix="/api/v1", tags=["Audit & Certification"])
app.include_router(health_router, prefix="/api/v1", tags=["Health Checks"])


# ---------------------------------------------------------------------------
# Routers — Phase 2 (repair & learning)
# ---------------------------------------------------------------------------
from routes.documents import router as documents_router
from routes.analytics import router as analytics_router
from routes.knowledge import router as knowledge_router

app.include_router(repair_router, prefix="/api/v1", tags=["Repair & Certification"])
app.include_router(documents_router, prefix="/api/v1", tags=["Documents Catalog"])
app.include_router(analytics_router, prefix="/api/v1", tags=["Analytics Summary"])
app.include_router(knowledge_router, prefix="/api/v1", tags=["Knowledge Base"])


@app.get("/")
async def root():
    return {
        "service": "intellifix-ai",
        "status": "ok",
        "health": "/health",
        "docs": "/docs",
    }
