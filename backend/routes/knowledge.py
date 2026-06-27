from fastapi import APIRouter, Query
from datetime import datetime, timezone

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory mock knowledge entries
# ---------------------------------------------------------------------------
MOCK_KNOWLEDGE_ENTRIES = [
    {
        "id": "RULE-01",
        "title": "BR-CLM-014: Billed Amount max cap",
        "description": "Billed Amount segment CLM02 must not exceed the contracted fee schedule maximum limit. Standard limit is set to $950.00 for primary Medicare claims.",
        "category": "SNIP Rules",
        "tags": ["CLM", "Billed Amount", "Medicare"],
        "used_count": 142,
        "source_file": "snip_validation_logic.md"
    },
    {
        "id": "RULE-02",
        "title": "SNIP2-NM108: Subscriber Identifier Validation",
        "description": "Subscriber Identification Code Qualifier segment NM108 must be populated when the member ID is designated as MI (Member Identification).",
        "category": "SNIP Rules",
        "tags": ["NM1", "Subscriber", "Member ID"],
        "used_count": 98,
        "source_file": "snip_validation_logic.md"
    },
    {
        "id": "RULE-03",
        "title": "GST-BR-012: B2B GSTIN Reference Match",
        "description": "GSTIN registry validation requires the seller GSTIN identifier to match e-Invoice registration lookup. Inconsistencies flag state code errors.",
        "category": "GST Rules",
        "tags": ["GSTIN", "B2B", "Invoice"],
        "used_count": 54,
        "source_file": "edi_mapping_reference.md"
    },
    {
        "id": "RULE-04",
        "title": "DTP Date Format Normalization",
        "description": "DTP date formats must be transformed from MMDDCCYY to CCYYMMDD before sending to claims engines. Automatically resolved for DTP03 segments.",
        "category": "Learned Correction",
        "tags": ["DTP", "Date Normalization", "Auto-learned"],
        "used_count": 124,
        "source_file": "claim_batch_837P_june.edi"
    },
    {
        "id": "RULE-05",
        "title": "INS05 Enrollment Code Pattern Correction",
        "description": "INS05 benefit code is corrected from null to 001 for Active coverage plans, aligning with historic employer registry approvals.",
        "category": "Learned Correction",
        "tags": ["INS", "Enrollment", "Employer Group"],
        "used_count": 110,
        "source_file": "enrollment_834_v5.xml"
    }
]

# ---------------------------------------------------------------------------
# GET /api/v1/knowledge/entries
# ---------------------------------------------------------------------------
@router.get("/knowledge/entries")
async def get_entries(category: str | None = Query(None)):
    """Retrieve indexed rule entries, optionally filtered by category."""
    filtered = MOCK_KNOWLEDGE_ENTRIES
    if category and category != "All":
        filtered = [e for e in MOCK_KNOWLEDGE_ENTRIES if e["category"].lower() == category.lower()]
        
    return {
        "entries": filtered,
        "total": len(MOCK_KNOWLEDGE_ENTRIES),
        "auto_learned": len([e for e in MOCK_KNOWLEDGE_ENTRIES if e["category"] == "Learned Correction"]),
        "last_indexed": "2026-06-25",
        "model": "text-embedding-3-small"
    }


# ---------------------------------------------------------------------------
# GET /api/v1/knowledge/search
# ---------------------------------------------------------------------------
@router.get("/knowledge/search")
async def search_entries(q: str = Query(...)):
    """Semantic search against the indexed rules catalog."""
    # Simulating simple substring filter for search query
    filtered = [
        e for e in MOCK_KNOWLEDGE_ENTRIES 
        if q.lower() in e["title"].lower() or q.lower() in e["description"].lower()
    ]
    return {
        "entries": filtered,
        "total": len(MOCK_KNOWLEDGE_ENTRIES),
        "auto_learned": len([e for e in MOCK_KNOWLEDGE_ENTRIES if e["category"] == "Learned Correction"]),
        "last_indexed": "2026-06-25",
        "model": "text-embedding-3-small"
    }


# ---------------------------------------------------------------------------
# GET /api/v1/knowledge/init/status
# ---------------------------------------------------------------------------
@router.get("/knowledge/init/status")
async def get_init_status():
    """Verify ruleset load and historical corrections seeding status."""
    return {
        "initialized": True,
        "rulesets_loaded": 4,
        "total_rules": 373,
        "historical_corrections": 197
    }


# ---------------------------------------------------------------------------
# POST /api/v1/knowledge/init/{ruleset_id}
# ---------------------------------------------------------------------------
@router.post("/knowledge/init/{ruleset_id}")
async def initialize_ruleset(ruleset_id: str):
    """Trigger manual initialization for a designated ruleset."""
    return {"status": "initialized", "ruleset_id": ruleset_id}
