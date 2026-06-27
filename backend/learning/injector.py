"""
Few-Shot Injector — Phase 2

Queries the feedback DB and formats historical approvals as few-shot
examples for the LLM prompt. Injected into the system prompt before
the user turn.
"""
from __future__ import annotations

from learning.db import get_similar_decisions


async def build_few_shot_block(error_code: str, segment_id: str | None) -> str:
    """
    Returns a formatted string block to inject into the LLM system prompt.
    If no historical decisions exist, returns an empty string.

    Format:
    ---
    PAST APPROVED CORRECTIONS (use as examples):
    1. Original: {original_value} → Fix: {proposed_fix}
    2. Original: {original_value} → Fix: {proposed_fix}
    ...
    ---
    """
    decisions = await get_similar_decisions(error_code, segment_id, limit=5)

    if not decisions:
        return ""

    lines = ["---", "PAST APPROVED CORRECTIONS (use as examples):"]
    for i, decision in enumerate(decisions, 1):
        original = decision.get("original_value", "N/A")
        fix = decision.get("proposed_fix", "N/A")
        lines.append(f"{i}. Original: {original} → Fix: {fix}")
    lines.append("---")

    return "\n".join(lines)
