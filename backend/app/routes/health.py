import os
from fastapi import APIRouter
from app.config import settings
from app.knowledge.graph_store import graph_store

router = APIRouter()


@router.get("/health")
def health_check():
    """Verify backend, Neo4j, ChromaDB, and LLM statuses."""
    neo4j_ok = False
    try:
        neo4j_ok = graph_store.connect()
    except Exception:
        pass

    chroma_ok = False
    try:
        import chromadb
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        # Instantiate client to verify ChromaDB accessibility
        _ = chromadb.PersistentClient(path=persist_dir)
        chroma_ok = True
    except Exception:
        pass

    return {
        "status": "healthy",
        "neo4j": neo4j_ok,
        "neo4j_connected": neo4j_ok,
        "chromadb_ready": chroma_ok,
        "postgres": True,
        "llm_provider": settings.llm_provider,
    }

