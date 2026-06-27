"""
Audit State Tracker — Phase 2

In-memory state manager for document repair sessions.
Holds the full audit trail for a document's repair lifecycle.

TODO: Replace module-level dict with Redis or a persistent DB for production.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pydantic import BaseModel

from repair.triage import RepairCategory, TriageResult


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RepairAction(BaseModel):
    error_id: str
    category: RepairCategory
    original_segment: str           # raw segment text or field value before change
    proposed_segment: str           # proposed value after change
    fix_description: str            # human-readable description
    status: str                     # "auto_applied" | "pending_review" | "approved" | "rejected"
    reviewed_by: str | None = None  # set when a human acts
    reviewed_at: str | None = None  # ISO timestamp
    # Extra context from Phase 1 pipeline for the frontend
    error_type: str = ""
    field: str = ""
    rule_violated: str = ""
    severity: str = ""
    llm_explanation: str = ""
    suggested_fix: str = ""


class AuditSession(BaseModel):
    document_id: str
    session_id: str                 # uuid4, generated at session start
    started_at: str                 # ISO timestamp
    job_id: str = ""
    pipeline_result: dict = {}      # full pipeline result for reference
    triage: list[TriageResult] = []
    actions: list[RepairAction] = []
    certified: bool = False
    certified_at: str | None = None


# ---------------------------------------------------------------------------
# In-memory session store
# TODO: Replace with Redis or a persistent DB for production
# ---------------------------------------------------------------------------
_sessions: dict[str, AuditSession] = {}


class AuditTracker:
    """Manages in-memory audit sessions for the repair flow."""

    def create_session(
        self,
        document_id: str,
        pipeline_result: dict,
        triage: list[TriageResult],
    ) -> AuditSession:
        """Create a new audit session."""
        session = AuditSession(
            document_id=document_id,
            session_id=str(uuid.uuid4()),
            started_at=datetime.now(timezone.utc).isoformat(),
            job_id=pipeline_result.get("job_id", ""),
            pipeline_result=pipeline_result,
            triage=triage,
            actions=[],
        )
        _sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> AuditSession | None:
        """Retrieve a session by ID."""
        return _sessions.get(session_id)

    def record_action(self, session_id: str, action: RepairAction) -> None:
        """Record a repair action in the session."""
        session = _sessions.get(session_id)
        if session:
            session.actions.append(action)

    def approve_action(self, session_id: str, error_id: str, reviewer: str) -> RepairAction | None:
        """Mark an action as approved."""
        session = _sessions.get(session_id)
        if not session:
            return None
        for action in session.actions:
            if action.error_id == error_id and action.status == "pending_review":
                action.status = "approved"
                action.reviewed_by = reviewer
                action.reviewed_at = datetime.now(timezone.utc).isoformat()
                return action
        return None

    def reject_action(self, session_id: str, error_id: str, reviewer: str) -> RepairAction | None:
        """Mark an action as rejected."""
        session = _sessions.get(session_id)
        if not session:
            return None
        for action in session.actions:
            if action.error_id == error_id and action.status == "pending_review":
                action.status = "rejected"
                action.reviewed_by = reviewer
                action.reviewed_at = datetime.now(timezone.utc).isoformat()
                return action
        return None

    def certify(self, session_id: str) -> AuditSession | None:
        """Mark the session as certified. Returns None if pending reviews remain."""
        session = _sessions.get(session_id)
        if not session:
            return None
        session.certified = True
        session.certified_at = datetime.now(timezone.utc).isoformat()
        return session

    def get_pending_actions(self, session_id: str) -> list[RepairAction]:
        """Return all actions still pending review."""
        session = _sessions.get(session_id)
        if not session:
            return []
        return [a for a in session.actions if a.status == "pending_review"]

    def get_actions_by_status(self, session_id: str, status: str) -> list[RepairAction]:
        """Return all actions with a given status."""
        session = _sessions.get(session_id)
        if not session:
            return []
        return [a for a in session.actions if a.status == status]


# Module-level singleton
audit_tracker = AuditTracker()
