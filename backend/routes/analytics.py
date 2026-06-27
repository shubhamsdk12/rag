from fastapi import APIRouter

router = APIRouter()

# ---------------------------------------------------------------------------
# GET /api/v1/analytics/summary
# ---------------------------------------------------------------------------
@router.get("/analytics/summary")
async def get_analytics_summary():
    """Returns compliance score trend, source errors breakdown, and KPI rates."""
    return {
        "total_processed": 5,
        "certified_today": 3,
        "auto_fix_rate": 0.83,
        "avg_time_saved_minutes": 47,
        "manual_effort_reduced": 0.78,
        "knowledge_graph_entries": 1847,
        "compliance_trend": [
            {"date": "Jun 20", "score": 88},
            {"date": "Jun 21", "score": 90},
            {"date": "Jun 22", "score": 85},
            {"date": "Jun 23", "score": 92},
            {"date": "Jun 24", "score": 87},
            {"date": "Jun 25", "score": 94},
            {"date": "Jun 26", "score": 96}
        ],
        "industry_distribution": [
            {"industry": "Healthcare", "count": 2},
            {"industry": "Banking", "count": 1},
            {"industry": "Enterprise SaaS", "count": 1},
            {"industry": "Insurance", "count": 1}
        ],
        "error_type_breakdown": [
            {"source": "Parser", "count": 145},
            {"source": "SNIP", "count": 312},
            {"source": "Graph", "count": 98},
            {"source": "Semantic", "count": 54}
        ],
        "confidence_distribution": [
            {"level": "high", "count": 12},
            {"level": "medium", "count": 8},
            {"level": "low", "count": 3}
        ],
        "top_violated_rules": [
            {"rule_code": "BR-CLM-014", "count": 142, "auto_fix_rate": 0.42},
            {"rule_code": "SNIP2-NM108", "count": 98, "auto_fix_rate": 0.96},
            {"rule_code": "SNIP1-DTP-001", "count": 76, "auto_fix_rate": 0.99},
            {"rule_code": "GST-BR-012", "count": 54, "auto_fix_rate": 0.0},
            {"rule_code": "SWIFT-BR-004", "count": 38, "auto_fix_rate": 0.91}
        ],
        "most_auto_repaired": [
            {"rule_code": "SNIP2-NM108", "count": 95},
            {"rule_code": "SNIP1-DTP-001", "count": 75},
            {"rule_code": "BR-CLM-014", "count": 65},
            {"rule_code": "SWIFT-BR-004", "count": 48},
            {"rule_code": "GST-BR-012", "count": 0}
        ]
    }
