from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timezone
from repair.audit_tracker import _sessions, AuditSession, RepairAction
from repair.triage import RepairCategory

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory mock documents & initial seeding logic
# ---------------------------------------------------------------------------
MOCK_DOCUMENTS = [
    {
        "document_id": "doc1",
        "filename": "claim_batch_837P_june.edi",
        "format": "EDI X12",
        "schema_type": "837P",
        "industry": "Healthcare",
        "compliance_score": 92.0,
        "status": "Certified",
        "knowledge_ruleset": "HIPAA 5010 Healthcare",
        "analyzed_at": "2026-06-25T20:02:00Z",
        "session_id": "session1"
    },
    {
        "document_id": "doc2",
        "filename": "enrollment_834_v5.xml",
        "format": "XML",
        "schema_type": "834",
        "industry": "Insurance",
        "compliance_score": 96.0,
        "status": "Certified",
        "knowledge_ruleset": "Insurance Claims P&C",
        "analyzed_at": "2026-06-25T18:15:00Z",
        "session_id": "session2"
    },
    {
        "document_id": "doc3",
        "filename": "swift_iso20022_payment.json",
        "format": "JSON",
        "schema_type": "SWIFT",
        "industry": "Banking",
        "compliance_score": 100.0,
        "status": "Certified",
        "knowledge_ruleset": "SWIFT ISO 20022 Banking",
        "analyzed_at": "2026-06-25T15:30:00Z",
        "session_id": "session3"
    },
    {
        "document_id": "doc4",
        "filename": "b2b_saas_invoice.csv",
        "format": "CSV",
        "schema_type": "GENERIC",
        "industry": "Enterprise SaaS",
        "compliance_score": 78.0,
        "status": "Pending Review",
        "knowledge_ruleset": "Enterprise Invoice B2B",
        "analyzed_at": "2026-06-25T11:45:00Z",
        "session_id": "session4"
    },
    {
        "document_id": "doc5",
        "filename": "claim_errors_snip3.edi",
        "format": "EDI X12",
        "schema_type": "837P",
        "industry": "Healthcare",
        "compliance_score": 64.0,
        "status": "Pending Review",
        "knowledge_ruleset": "HIPAA 5010 Healthcare",
        "analyzed_at": "2026-06-25T08:02:00Z",
        "session_id": "session5"
    }
]

# Seed caches on startup / import
def seed_mock_data():
    from main import _analysis_results
    
    # 1. Seed Ingest Results
    for mock in MOCK_DOCUMENTS:
        doc_id = mock["document_id"]
        if doc_id not in _analysis_results:
            _analysis_results[doc_id] = {
                "status": mock["status"],
                "filename": mock["filename"],
                "doc_id": doc_id,
                "document_id": doc_id,
                "schema_type": mock["schema_type"],
                "format": mock["format"],
                "industry": mock["industry"],
                "compliance_score": mock["compliance_score"],
                "step0_ruleset": mock["knowledge_ruleset"],
                "step0_rules_checked": {
                    "schema": 47,
                    "business_rules": 31,
                    "regulatory": 18,
                    "cross_field": 12,
                    "master_data": 9
                },
                "processing_time_ms": 342,
                "errors": [
                    {
                        "error_id": f"ERR-{doc_id}-01",
                        "code": "GRAPH-CLM02-EXCEED",
                        "severity": "error",
                        "source": "graph",
                        "message": "Billed amount $1,250.00 exceeds contracted maximum $950.00",
                        "segment_id": "CLM",
                        "element_index": 2,
                        "explanation": {
                            "root_cause": "The CLM02 segment contains $1,250.00 which is higher than the max limit allowed for Medicare fee schedules.",
                            "violated_rule": "Billed Amount ≤ Contracted Maximum",
                            "violated_rule_code": "BR-CLM-014",
                            "regulation_reference": "ASC X12N 005010X222A2 — Loop 2300, CLM02",
                            "suggested_fix": "CLM02:950.00",
                            "confidence": "medium",
                            "confidence_score": 0.71,
                            "reasoning": "Under Medicare Fee schedule guidelines, the maximum fee code allowed is $950.00. Automatic repair updates target CLM02.",
                            "graphrag_context": {
                                "retrieved_rules": ["BR-CLM-014: Billed ≤ Contracted Max", "BR-CLM-016: Amount must match fee schedule"],
                                "related_entities": ["CPT:99213", "Payer:Medicare", "FeeSched:2024"],
                                "historical_pattern": "HC-0047: Adjusted CLM02 from 1250.00 to 950.00 for CPT 99213 Medicare claims (applied 12 times, 100% success)"
                            },
                            "impact_preview": {
                                "affected_fields": ["CLM02", "CLM03", "SV102"],
                                "rules_at_risk": ["BR-TOT-001: Total charges must equal sum of service lines"],
                                "compliance_impact": "Correction brings the claim into compliance with Medicare fee schedule requirements, preventing CO-45 denial.",
                                "operational_impact": "Reduces payment delay by approximately 14 days. Claim will auto-adjudicate post-correction."
                            }
                        }
                    }
                ]
            }
            
    # 2. Seed Audit Sessions
    for mock in MOCK_DOCUMENTS:
        s_id = mock["session_id"]
        doc_id = mock["document_id"]
        if s_id not in _sessions:
            # Create a mock session
            _sessions[s_id] = AuditSession(
                document_id=doc_id,
                session_id=s_id,
                started_at=mock["analyzed_at"],
                job_id=f"job-{doc_id}",
                certified=mock["status"] == "Certified",
                certified_at=mock["analyzed_at"] if mock["status"] == "Certified" else None,
                pipeline_result=_analysis_results[doc_id],
                actions=[
                    RepairAction(
                        error_id=f"ERR-{doc_id}-01",
                        category=RepairCategory.RISKY_FIX,
                        original_segment="CLM02:1250.00",
                        proposed_segment="CLM02:950.00",
                        fix_description="Adjust CLM02 to contracted max limit",
                        status="approved" if mock["status"] == "Certified" else "pending_review",
                        reviewed_by="compliance_officer" if mock["status"] == "Certified" else None,
                        reviewed_at=mock["analyzed_at"] if mock["status"] == "Certified" else None,
                        error_type="GRAPH-CLM02-EXCEED",
                        field="CLM02",
                        rule_violated="BR-CLM-014",
                        severity="error",
                        llm_explanation="Billed amount exceeds contracted maximum",
                        suggested_fix="CLM02:950.00"
                    )
                ]
            )

# Execute seeding
seed_mock_data()


# ---------------------------------------------------------------------------
# GET /api/v1/documents/recent
# ---------------------------------------------------------------------------
@router.get("/documents/recent")
async def get_recent_documents(limit: int = Query(10)):
    from main import _analysis_results
    documents = []
    
    # Read from cache
    for doc_id, report in _analysis_results.items():
        session_id = None
        status = "Pending Review"
        
        # Check active session
        for s_id, s in _sessions.items():
            if s.document_id == doc_id:
                session_id = s_id
                status = "Certified" if s.certified else "Pending Review"
                break
                
        documents.append({
            "document_id": doc_id,
            "filename": report.get("filename", "claim.edi"),
            "format": report.get("format", "EDI X12"),
            "schema_type": report.get("schema_type", "837P"),
            "industry": report.get("industry", "Healthcare"),
            "compliance_score": report.get("compliance_score", 100.0),
            "status": status,
            "knowledge_ruleset": report.get("step0_ruleset", "HIPAA 5010 Healthcare"),
            "analyzed_at": report.get("analyzed_at", datetime.now(timezone.utc).isoformat()),
            "session_id": session_id
        })
        
    # Sort newest first
    documents = sorted(documents, key=lambda x: x["analyzed_at"], reverse=True)
    return {"documents": documents[:limit]}


# ---------------------------------------------------------------------------
# GET /api/v1/graph/{document_id}
# ---------------------------------------------------------------------------
@router.get("/graph/{document_id}")
async def get_graph(document_id: str):
    """Returns structured relationships graph for Graph Explorer."""
    # We return a beautiful mock graph matching colors & styles for nodes/edges
    return {
        "document_id": document_id,
        "cross_document_links": 1,
        "nodes": [
            {
                "id": "pat_1",
                "type": "Patient",
                "label": "John Smith (PHI-Masked)",
                "properties": {
                    "patient_id": "PT-88301",
                    "gender": "M",
                    "dob": "1980-01-01"
                }
            },
            {
                "id": "prov_1",
                "type": "Provider",
                "label": "Sunrise Medical Group",
                "properties": {
                    "npi": "1992019201",
                    "organization": "Sunrise Clinic Ltd",
                    "specialty": "Internal Medicine"
                }
            },
            {
                "id": "claim_1",
                "type": "Claim",
                "label": "CLM-2024-0612",
                "properties": {
                    "claim_id": "CLM-2024-0612",
                    "amount": "$1,250.00",
                    "date": "2026-06-25"
                }
            },
            {
                "id": "service_1",
                "type": "Service",
                "label": "Office Visit E/M Level 3",
                "properties": {
                    "cpt_code": "99213",
                    "service_date": "2026-06-25",
                    "amount": "$150.00"
                }
            },
            {
                "id": "payment_1",
                "type": "Payment",
                "label": "Expected $950.00",
                "properties": {
                    "payer": "Medicare",
                    "fee_schedule": "2026 MPFS"
                }
            }
        ],
        "edges": [
            {
                "source": "pat_1",
                "target": "claim_1",
                "label": "submitted",
                "style": "normal"
            },
            {
                "source": "prov_1",
                "target": "claim_1",
                "label": "billed by",
                "style": "normal"
            },
            {
                "source": "claim_1",
                "target": "service_1",
                "label": "includes",
                "style": "normal"
            },
            {
                "source": "claim_1",
                "target": "payment_1",
                "label": "expects",
                "style": "normal"
            },
            {
                "source": "payment_1",
                "target": "claim_1",
                "label": "prior claim",
                "style": "cross_doc"
            }
        ]
    }
