"""
Feedback Database — Phase 2

Async SQLite database for storing human feedback decisions.
Used for continuous learning: past decisions are injected as few-shot
examples into future LLM prompts.

Uses aiosqlite (raw SQL, no ORM) per spec.
"""
from __future__ import annotations

import os
import aiosqlite

# Configurable path via environment variable
_DB_PATH = os.getenv("FEEDBACK_DB_PATH", "./intellifix_feedback.db")


async def init_db() -> None:
    """Create tables if they do not exist. Call once at startup."""
    async with aiosqlite.connect(_DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS human_feedback_logs (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                error_code    TEXT    NOT NULL,
                snip_level    INTEGER,
                segment_id    TEXT,
                original_value TEXT,
                proposed_fix  TEXT    NOT NULL,
                decision      TEXT    NOT NULL CHECK(decision IN ('approved', 'rejected')),
                reviewer      TEXT,
                created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
            )
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_error_code
            ON human_feedback_logs(error_code)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_segment_id
            ON human_feedback_logs(segment_id)
        """)
        await db.commit()


async def log_decision(
    error_code: str,
    snip_level: int | None,
    segment_id: str | None,
    original_value: str,
    proposed_fix: str,
    decision: str,         # "approved" | "rejected"
    reviewer: str | None,
) -> None:
    """
    Record a human (or auto) decision to the feedback database.

    Per PHI rules: original_value should contain only the segment ID
    and element position — NOT raw patient names or SSNs.
    """
    async with aiosqlite.connect(_DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO human_feedback_logs
                (error_code, snip_level, segment_id, original_value,
                 proposed_fix, decision, reviewer)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (error_code, snip_level, segment_id, original_value,
             proposed_fix, decision, reviewer),
        )
        await db.commit()


async def get_similar_decisions(
    error_code: str,
    segment_id: str | None,
    limit: int = 5,
) -> list[dict]:
    """
    Returns up to `limit` past approved decisions for the same error_code,
    ordered by most recent first. Used for few-shot injection.
    """
    async with aiosqlite.connect(_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if segment_id:
            cursor = await db.execute(
                """
                SELECT error_code, segment_id, original_value, proposed_fix,
                       decision, reviewer, created_at
                FROM human_feedback_logs
                WHERE error_code = ? AND decision = 'approved'
                ORDER BY
                    CASE WHEN segment_id = ? THEN 0 ELSE 1 END,
                    created_at DESC
                LIMIT ?
                """,
                (error_code, segment_id, limit),
            )
        else:
            cursor = await db.execute(
                """
                SELECT error_code, segment_id, original_value, proposed_fix,
                       decision, reviewer, created_at
                FROM human_feedback_logs
                WHERE error_code = ? AND decision = 'approved'
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (error_code, limit),
            )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
