"""
Repair API Routes — Phase 2

All /api/v1/repair/* endpoints for the human-in-the-loop repair flow.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from repair.triage import triage_errors, RepairCategory
from repair.safe_fixer import SafeFixer, UnsupportedFixError
from repair.audit_tracker import audit_tracker, RepairAction, AuditSession
from learning.db import log_decision

router = APIRouter()
_safe_fixer = SafeFixer()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class StartRepairRequest(BaseModel):
    document_id: str


class ApproveRequest(BaseModel):
    reviewer: str


class RejectRequest(BaseModel):
    reviewer: str
    reason: str | None = None


# ---------------------------------------------------------------------------
# POST /api/v1/repair/start
# ---------------------------------------------------------------------------
@router.post("/repair/start")
async def start_repair(req: StartRepairRequest):
    """
    Start a repair session for a previously ingested document.
    Runs triage, auto-applies safe fixes, and queues risky fixes for review.
    """
    # Import here to avoid circular imports
    from main import get_analysis_result

    pipeline_result = get_analysis_result(req.document_id)
    if not pipeline_result:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis result found for document_id '{req.document_id}'. "
                   f"Please run POST /api/v1/ingest first.",
        )

    # 1. Triage all errors
    triage_results = triage_errors(pipeline_result)

    # 2. Create audit session
    session = audit_tracker.create_session(
        document_id=req.document_id,
        pipeline_result=pipeline_result,
        triage=triage_results,
    )

    errors = pipeline_result.get("errors", [])
    error_map = {e.get("result_id", ""): e for e in errors}

    auto_applied_count = 0
    pending_review_count = 0
    no_fix_count = 0

    for tr in triage_results:
        error = error_map.get(tr.error_id, {})

        if tr.category == RepairCategory.SAFE_FIX:
            # Try to auto-apply the fix
            fix_desc = error.get("suggested_fix", "") or "Auto-applied safe fix"
            original_val = error.get("value", "")

            action = RepairAction(
                error_id=tr.error_id,
                category=tr.category,
                original_segment=original_val,
                proposed_segment=error.get("suggested_fix", original_val),
                fix_description=fix_desc,
                status="auto_applied",
                reviewed_by="system_auto",
                error_type=error.get("error_type", ""),
                field=error.get("field", ""),
                rule_violated=error.get("rule_violated", ""),
                severity=error.get("severity", ""),
                llm_explanation=error.get("llm_explanation", ""),
                suggested_fix=error.get("suggested_fix", ""),
            )
            audit_tracker.record_action(session.session_id, action)

            # Log to feedback DB
            await log_decision(
                error_code=error.get("error_type", "unknown"),
                snip_level=None,
                segment_id=error.get("field", ""),
                original_value=error.get("field", ""),  # PHI safe: log field name, not value
                proposed_fix=fix_desc,
                decision="approved",
                reviewer="system_auto",
            )
            auto_applied_count += 1

        elif tr.category == RepairCategory.RISKY_FIX:
            # Queue for human review
            original_val = error.get("value", "")
            suggested = error.get("suggested_fix", "Review required")

            action = RepairAction(
                error_id=tr.error_id,
                category=tr.category,
                original_segment=original_val,
                proposed_segment=suggested,
                fix_description=f"Risky fix: {tr.reason}",
                status="pending_review",
                error_type=error.get("error_type", ""),
                field=error.get("field", ""),
                rule_violated=error.get("rule_violated", ""),
                severity=error.get("severity", ""),
                llm_explanation=error.get("llm_explanation", ""),
                suggested_fix=error.get("suggested_fix", ""),
            )
            audit_tracker.record_action(session.session_id, action)
            pending_review_count += 1

        else:
            # NO_FIX — record but do nothing
            action = RepairAction(
                error_id=tr.error_id,
                category=tr.category,
                original_segment=error.get("value", ""),
                proposed_segment="",
                fix_description=f"No fix available: {tr.reason}",
                status="no_fix",
                error_type=error.get("error_type", ""),
                field=error.get("field", ""),
                rule_violated=error.get("rule_violated", ""),
                severity=error.get("severity", ""),
                llm_explanation=error.get("llm_explanation", ""),
                suggested_fix="",
            )
            audit_tracker.record_action(session.session_id, action)
            no_fix_count += 1

    return {
        "session_id": session.session_id,
        "document_id": req.document_id,
        "job_id": session.job_id,
        "auto_applied": auto_applied_count,
        "pending_review": pending_review_count,
        "no_fix": no_fix_count,
        "actions": [a.model_dump() for a in session.actions],
    }


# ---------------------------------------------------------------------------
# GET /api/v1/repair/queue/active-count
# ---------------------------------------------------------------------------
@router.get("/repair/queue/active-count")
async def get_active_count():
    """Returns the total number of actions pending review across all sessions."""
    from repair.audit_tracker import _sessions
    count = 0
    for session in _sessions.values():
        if not session.certified:
            count += len([a for a in session.actions if a.status == "pending_review"])
    return {"count": count}


# ---------------------------------------------------------------------------
# GET /api/v1/repair/queue/all
# ---------------------------------------------------------------------------
@router.get("/repair/queue/all")
async def get_all_queue():
    """Returns all pending_review actions globally, enriched with document context."""
    from repair.audit_tracker import _sessions
    pending_actions = []
    
    # Check if _sessions is empty, seed mock data if so for better UI experience
    if not _sessions:
        # Return empty list or basic mock actions to avoid blank screen
        return {"total_pending": 0, "actions": []}

    for session in _sessions.values():
        if not session.certified:
            filename = session.pipeline_result.get("filename", "claim_batch_837P_june.edi")
            format_name = "EDI X12" if filename.endswith(".edi") else "JSON"
            schema_type = session.pipeline_result.get("schema_type", "837P")
            
            for action in session.actions:
                if action.status == "pending_review":
                    act_dict = action.model_dump()
                    act_dict["document_id"] = session.document_id
                    act_dict["session_id"] = session.session_id
                    act_dict["filename"] = filename
                    act_dict["format"] = format_name
                    act_dict["schema_type"] = schema_type
                    pending_actions.append(act_dict)
                    
    return {
        "total_pending": len(pending_actions),
        "actions": pending_actions
    }


# ---------------------------------------------------------------------------
# GET /api/v1/repair/queue/{session_id}
# ---------------------------------------------------------------------------
@router.get("/repair/queue/{session_id}")
async def get_repair_queue(session_id: str):
    """Returns all pending_review actions for the given session."""
    session = audit_tracker.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    pending = audit_tracker.get_pending_actions(session_id)

    return {
        "session_id": session_id,
        "pending_count": len(pending),
        "actions": [
            {
                "error_id": a.error_id,
                "original_segment": a.original_segment,
                "proposed_segment": a.proposed_segment,
                "fix_description": a.fix_description,
                "error_type": a.error_type,
                "field": a.field,
                "rule_violated": a.rule_violated,
                "severity": a.severity,
                "llm_explanation": a.llm_explanation,
                "suggested_fix": a.suggested_fix,
            }
            for a in pending
        ],
    }


# ---------------------------------------------------------------------------
# POST /api/v1/repair/approve/{session_id}/{error_id}
# ---------------------------------------------------------------------------
@router.post("/repair/approve/{session_id}/{error_id}")
async def approve_action(session_id: str, error_id: str, req: ApproveRequest):
    """Approve a risky fix after human review."""
    session = audit_tracker.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    action = audit_tracker.approve_action(session_id, error_id, req.reviewer)
    if not action:
        raise HTTPException(
            status_code=404,
            detail=f"No pending action found for error_id '{error_id}'",
        )

    # Log to feedback DB (PHI safe: field name, not raw value)
    await log_decision(
        error_code=action.error_type or "unknown",
        snip_level=None,
        segment_id=action.field,
        original_value=action.field,  # PHI safe
        proposed_fix=action.proposed_segment,
        decision="approved",
        reviewer=req.reviewer,
    )

    return {"status": "approved", "error_id": error_id}


# ---------------------------------------------------------------------------
# POST /api/v1/repair/reject/{session_id}/{error_id}
# ---------------------------------------------------------------------------
@router.post("/repair/reject/{session_id}/{error_id}")
async def reject_action(session_id: str, error_id: str, req: RejectRequest):
    """Reject a risky fix after human review."""
    session = audit_tracker.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    action = audit_tracker.reject_action(session_id, error_id, req.reviewer)
    if not action:
        raise HTTPException(
            status_code=404,
            detail=f"No pending action found for error_id '{error_id}'",
        )

    # Log to feedback DB
    await log_decision(
        error_code=action.error_type or "unknown",
        snip_level=None,
        segment_id=action.field,
        original_value=action.field,  # PHI safe
        proposed_fix=action.proposed_segment,
        decision="rejected",
        reviewer=req.reviewer,
    )

    return {"status": "rejected", "error_id": error_id}


# ---------------------------------------------------------------------------
# POST /api/v1/repair/certify/{session_id}
# ---------------------------------------------------------------------------
@router.post("/repair/certify/{session_id}")
async def certify_session(session_id: str):
    """
    Certify a repair session. Only succeeds if zero pending reviews remain.
    Returns the full AuditCertificate on success.
    """
    session = audit_tracker.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    pending = audit_tracker.get_pending_actions(session_id)
    if pending:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "cannot_certify",
                "pending_count": len(pending),
                "message": "All risky fixes must be reviewed before certification.",
            },
        )

    certified = audit_tracker.certify(session_id)

    # Compute action counts
    auto_applied = len(audit_tracker.get_actions_by_status(session_id, "auto_applied"))
    human_approved = len(audit_tracker.get_actions_by_status(session_id, "approved"))
    human_rejected = len(audit_tracker.get_actions_by_status(session_id, "rejected"))
    no_fix = len(audit_tracker.get_actions_by_status(session_id, "no_fix"))

    return {
        "session_id": session_id,
        "document_id": certified.document_id,
        "job_id": certified.job_id,
        "certified_at": certified.certified_at,
        "total_errors_found": len(certified.actions),
        "auto_applied": auto_applied,
        "human_approved": human_approved,
        "human_rejected": human_rejected,
        "no_fix": no_fix,
        "actions": [a.model_dump() for a in certified.actions],
        "pipeline_result": certified.pipeline_result,
        "status": "CERTIFIED_READY_FOR_TRANSMISSION",
    }



