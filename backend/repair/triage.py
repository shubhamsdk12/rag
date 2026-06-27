"""
Triage Classifier — Phase 2

Classifies each validation error from the Phase 1 pipeline into a RepairCategory:
  - SAFE_FIX:  deterministic, low-risk, auto-applied
  - RISKY_FIX: financial or identity fields, requires human approval
  - NO_FIX:    error cannot be auto-corrected
"""
from __future__ import annotations

from enum import Enum
from pydantic import BaseModel


class RepairCategory(str, Enum):
    SAFE_FIX = "safe_fix"
    RISKY_FIX = "risky_fix"
    NO_FIX = "no_fix"


class TriageResult(BaseModel):
    error_id: str           # matches result_id from the pipeline
    category: RepairCategory
    reason: str             # human-readable explanation of the triage decision


# ---------------------------------------------------------------------------
# Financial / identity element markers
# ---------------------------------------------------------------------------
_RISKY_FIELDS = {"clm02", "svc02", "nm109", "dmg", "npi", "claim_id", "total_charge"}
_RISKY_KEYWORDS_IN_RULE = {
    "npi", "duplicate", "claim_id", "charge", "amount",
    "billed", "paid", "future", "temporal", "payment",
    "orphan", "financial", "identity", "demographic",
}
_SAFE_KEYWORDS_IN_RULE = {
    "space", "padding", "format", "delimiter", "count",
    "isa", "iea", "mismatch", "segment count", "date",
}


def _classify_single(
    error_type: str,
    field: str,
    rule_violated: str,
    severity: str,
    triage_category: str,
    confidence: str | None = None,
) -> tuple[RepairCategory, str]:
    """Apply the triage rules in order; first match wins."""
    field_lower = (field or "").lower()
    rule_lower = (rule_violated or "").lower()
    combined = f"{field_lower} {rule_lower}"

    # Rule 1: Financial / identity elements → RISKY
    for marker in _RISKY_FIELDS:
        if marker in field_lower:
            return RepairCategory.RISKY_FIX, f"Field '{field}' involves financial or identity data"

    # Rule 2: Keywords in rule text → RISKY
    for kw in _RISKY_KEYWORDS_IN_RULE:
        if kw in rule_lower:
            return RepairCategory.RISKY_FIX, f"Rule mentions '{kw}' — flagged for human review"

    # Rule 3: Pure formatting / structural → SAFE
    for kw in _SAFE_KEYWORDS_IN_RULE:
        if kw in combined:
            return RepairCategory.SAFE_FIX, f"Formatting/structural issue ('{kw}' detected)"

    # Rule 4: Phase 1 triage already classified as safe_fix
    if triage_category == "safe_fix":
        return RepairCategory.SAFE_FIX, "Phase 1 triage classified as safe_fix"

    # Rule 5: Low confidence → NO_FIX
    if confidence and confidence.lower() == "low":
        return RepairCategory.NO_FIX, "LLM confidence is low — cannot auto-correct"

    # Rule 6: Phase 1 triage classified as risky_fix
    if triage_category == "risky_fix":
        return RepairCategory.RISKY_FIX, "Phase 1 triage classified as risky_fix"

    # Default → RISKY_FIX
    return RepairCategory.RISKY_FIX, "Default classification — requires human review"


def triage_errors(pipeline_result: dict) -> list[TriageResult]:
    """
    Classify each error in the pipeline result into a RepairCategory.

    Args:
        pipeline_result: The dict returned by process_document_pipeline().
                         Expected keys: 'errors' (list of error dicts).

    Returns:
        List of TriageResult objects, one per error.
    """
    results: list[TriageResult] = []
    errors = pipeline_result.get("errors", [])

    for error in errors:
        error_id = error.get("result_id", "")
        error_type = error.get("error_type", "")
        field = error.get("field", "")
        rule_violated = error.get("rule_violated", "")
        severity = error.get("severity", "")
        triage_cat = error.get("triage_category", "")
        # Confidence from LLM explanation if available
        confidence = None
        explanation = error.get("llm_explanation", "")
        if explanation and "low" in explanation.lower():
            confidence = "low"

        category, reason = _classify_single(
            error_type=error_type,
            field=field,
            rule_violated=rule_violated,
            severity=severity,
            triage_category=triage_cat,
            confidence=confidence,
        )

        results.append(TriageResult(
            error_id=error_id,
            category=category,
            reason=reason,
        ))

    return results
