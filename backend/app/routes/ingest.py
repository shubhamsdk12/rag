from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.orchestrator import process_document_pipeline
from app.utils.logger import pipeline_logger

router = APIRouter()


@router.post("/ingest")
async def ingest_claim(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Accept claim file upload, run multi-agent validations, persist results in PostgreSQL, and return report."""
    pipeline_logger.info(f"API upload received for file: {file.filename}")
    content = await file.read()
    
    # Run pipeline with database session
    report = await process_document_pipeline(db, content, file.filename)

    # Phase 2: Store result in memory cache for repair flow
    doc_id = report.get("doc_id", "")
    if doc_id:
        try:
            from main import store_analysis_result
            store_analysis_result(doc_id, report)
            pipeline_logger.info(f"Stored analysis result for doc_id={doc_id} in repair cache.")
        except ImportError:
            pipeline_logger.warning("Could not import store_analysis_result — repair cache not available.")

    return report
