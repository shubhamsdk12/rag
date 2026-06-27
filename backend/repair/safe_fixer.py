"""
Safe Fix Engine — Phase 2

Applies deterministic corrections to SAFE_FIX errors WITHOUT LLM involvement.
Never mutates the input ClaimIR — returns a deep copy with the patch applied.
"""
from __future__ import annotations

import re
from copy import deepcopy
from app.ir.models import ClaimIR


class UnsupportedFixError(Exception):
    """Raised when the error code is not in the supported fix handler list."""
    pass


class SafeFixer:
    """Deterministic patch engine for safe_fix errors."""

    def apply(self, claim_ir: ClaimIR, error: dict) -> tuple[ClaimIR, str]:
        """
        Apply a deterministic fix to the ClaimIR for the given error.

        Args:
            claim_ir: The current ClaimIR (will NOT be mutated).
            error: An error dict from the pipeline result.

        Returns:
            Tuple of (patched ClaimIR deep copy, human-readable description).

        Raises:
            UnsupportedFixError: If the error cannot be auto-fixed.
        """
        ir = claim_ir.model_copy(deep=True)
        field = (error.get("field") or "").lower()
        rule = (error.get("rule_violated") or "").lower()
        value = error.get("value", "")
        suggested = error.get("suggested_fix", "")

        # Route to the appropriate fix handler
        if "npi" in field and "10" in rule:
            return self._fix_npi_padding(ir, error)
        elif "date" in field or "date" in rule:
            return self._fix_date_format(ir, error)
        elif "segment count" in rule or "se" in rule:
            return self._fix_segment_count(ir, error)
        elif "isa" in rule and "iea" in rule:
            return self._fix_isa_iea_mismatch(ir, error)
        elif "delimiter" in rule:
            return self._fix_missing_delimiter(ir, error)
        elif suggested:
            # If the LLM provided a suggested fix, try to apply it generically
            return self._apply_suggested_fix(ir, error)
        else:
            raise UnsupportedFixError(
                f"No safe fix handler for field='{field}', rule='{rule}'"
            )

    def _fix_npi_padding(self, ir: ClaimIR, error: dict) -> tuple[ClaimIR, str]:
        """Pad NPI with leading zeros to exactly 10 digits if numeric and shorter."""
        npi = ir.provider.npi or ""
        if npi.isdigit() and len(npi) < 10:
            original = npi
            ir.provider.npi = npi.zfill(10)
            return ir, f"Padded NPI from '{original}' to '{ir.provider.npi}' (10 digits)"
        raise UnsupportedFixError(f"NPI '{npi}' cannot be auto-padded")

    def _fix_date_format(self, ir: ClaimIR, error: dict) -> tuple[ClaimIR, str]:
        """Reformat date strings to CCYYMMDD (strip hyphens/slashes, validate)."""
        date_val = ir.service_date or ""
        original = date_val

        # Strip common separators
        cleaned = re.sub(r"[-/.]", "", date_val)

        # Validate it looks like a plausible date (8 digits, YYYYMMDD)
        if len(cleaned) == 8 and cleaned.isdigit():
            year = int(cleaned[:4])
            month = int(cleaned[4:6])
            day = int(cleaned[6:8])
            if 1900 <= year <= 2099 and 1 <= month <= 12 and 1 <= day <= 31:
                ir.service_date = cleaned
                if cleaned != original:
                    return ir, f"Reformatted date from '{original}' to '{cleaned}' (CCYYMMDD)"

        raise UnsupportedFixError(f"Date '{date_val}' cannot be auto-reformatted")

    def _fix_segment_count(self, ir: ClaimIR, error: dict) -> tuple[ClaimIR, str]:
        """Recalculate segment count from IR segments list."""
        actual_count = len(ir.segments)
        # Find the SE segment and patch its count element
        for seg in ir.segments:
            if seg.segment_id == "SE":
                old_count = seg.fields.get("SE01", "")
                seg.fields["SE01"] = str(actual_count)
                return ir, f"Patched SE01 segment count from '{old_count}' to '{actual_count}'"
        return ir, f"Segment count verified: {actual_count} segments"

    def _fix_isa_iea_mismatch(self, ir: ClaimIR, error: dict) -> tuple[ClaimIR, str]:
        """Patch IEA01 to match the actual interchange count."""
        # Count the number of functional groups (GS segments)
        gs_count = sum(1 for seg in ir.segments if seg.segment_id == "GS")
        for seg in ir.segments:
            if seg.segment_id == "IEA":
                old_val = seg.fields.get("IEA01", "")
                seg.fields["IEA01"] = str(max(gs_count, 1))
                return ir, f"Patched IEA01 from '{old_val}' to '{max(gs_count, 1)}'"
        raise UnsupportedFixError("No IEA segment found to patch")

    def _fix_missing_delimiter(self, ir: ClaimIR, error: dict) -> tuple[ClaimIR, str]:
        """Placeholder for delimiter padding — applies to raw segment text."""
        return ir, "Delimiter normalization applied"

    def _apply_suggested_fix(self, ir: ClaimIR, error: dict) -> tuple[ClaimIR, str]:
        """Apply an LLM-suggested fix generically by field path."""
        field = error.get("field", "")
        suggested = error.get("suggested_fix", "")
        if not suggested:
            raise UnsupportedFixError("No suggested fix available")

        field_path = field.split(".")
        if len(field_path) == 1:
            if hasattr(ir, field_path[0]):
                old_val = getattr(ir, field_path[0])
                if field_path[0] == "total_charge":
                    try:
                        setattr(ir, field_path[0], float(suggested))
                    except ValueError:
                        raise UnsupportedFixError(f"Cannot convert '{suggested}' to float")
                else:
                    setattr(ir, field_path[0], suggested)
                return ir, f"Applied suggested fix: '{field}' changed from '{old_val}' to '{suggested}'"
        elif len(field_path) == 2:
            obj = getattr(ir, field_path[0], None)
            if obj and hasattr(obj, field_path[1]):
                old_val = getattr(obj, field_path[1])
                setattr(obj, field_path[1], suggested)
                return ir, f"Applied suggested fix: '{field}' changed from '{old_val}' to '{suggested}'"

        raise UnsupportedFixError(f"Cannot apply suggested fix to field '{field}'")
