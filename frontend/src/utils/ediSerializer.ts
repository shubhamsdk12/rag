/**
 * EDI Serializer — Phase 2
 *
 * Reconstructs raw X12 EDI text from a pipeline result's claim data.
 * Uses `*` as element delimiter and `~` as segment terminator (X12 defaults).
 */

interface SegmentData {
  segment_id: string;
  position: number;
  fields: Record<string, string>;
}

interface ClaimPayload {
  claim_id: string;
  patient: {
    id: string;
    name: string;
    dob: string | null;
    member_id: string | null;
  };
  provider: {
    npi: string;
    name: string;
    taxonomy_code: string | null;
  };
  service_date: string;
  total_charge: number;
  diagnosis_codes: string[];
  procedure_codes: string[];
  segments?: SegmentData[];
}

/**
 * Convert a pipeline result (or claim payload) back into X12 EDI text.
 * If segments are present, reconstruct from them. Otherwise, build
 * a minimal 837P-style EDI from the claim fields.
 */
export function irToEdi(payload: ClaimPayload | Record<string, unknown>): string {
  const claim = payload as ClaimPayload;
  const lines: string[] = [];
  const delim = '*';
  const term = '~';

  // If we have raw segments, reconstruct from them
  if (claim.segments && claim.segments.length > 0) {
    for (const seg of claim.segments) {
      const sortedKeys = Object.keys(seg.fields).sort();
      const elements = sortedKeys.map((k) => seg.fields[k]);
      lines.push(`${seg.segment_id}${delim}${elements.join(delim)}${term}`);
    }
    return lines.join('\n');
  }

  // Otherwise build a minimal 837P EDI representation
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(11, 15).replace(':', '');

  // ISA
  lines.push(
    `ISA${delim}00${delim}          ${delim}00${delim}          ${delim}ZZ${delim}SENDER         ${delim}ZZ${delim}RECEIVER       ${delim}${dateStr.slice(2)}${delim}${timeStr}${delim}^${delim}00501${delim}000000001${delim}0${delim}P${delim}:${term}`,
  );

  // GS
  lines.push(
    `GS${delim}HC${delim}SENDER${delim}RECEIVER${delim}${dateStr}${delim}${timeStr}${delim}1${delim}X${delim}005010X222A1${term}`,
  );

  // ST
  lines.push(`ST${delim}837${delim}0001${delim}005010X222A1${term}`);

  // BHT
  lines.push(
    `BHT${delim}0019${delim}00${delim}${claim.claim_id || 'REF001'}${delim}${dateStr}${delim}${timeStr}${delim}CH${term}`,
  );

  // NM1*85 — Billing Provider
  const provParts = (claim.provider?.name || '').split(' ');
  lines.push(
    `NM1${delim}85${delim}1${delim}${provParts[0] || ''}${delim}${provParts.slice(1).join(' ') || ''}${delim}${delim}${delim}${delim}XX${delim}${claim.provider?.npi || ''}${term}`,
  );

  // PRV
  if (claim.provider?.taxonomy_code) {
    lines.push(
      `PRV${delim}PE${delim}PXC${delim}${claim.provider.taxonomy_code}${term}`,
    );
  }

  // NM1*QC — Patient
  const patParts = (claim.patient?.name || '').split(' ');
  lines.push(
    `NM1${delim}QC${delim}1${delim}${patParts.slice(-1)[0] || ''}${delim}${patParts[0] || ''}${delim}${delim}${delim}${delim}MI${delim}${claim.patient?.id || ''}${term}`,
  );

  // DMG
  if (claim.patient?.dob) {
    lines.push(`DMG${delim}D8${delim}${claim.patient.dob}${term}`);
  }

  // CLM
  lines.push(
    `CLM${delim}${claim.claim_id || ''}${delim}${claim.total_charge || 0}${delim}${delim}${delim}11:B:1${term}`,
  );

  // HI — Diagnosis codes
  if (claim.diagnosis_codes && claim.diagnosis_codes.length > 0) {
    const hiElements = claim.diagnosis_codes.map((c) => `ABK:${c}`);
    lines.push(`HI${delim}${hiElements.join(delim)}${term}`);
  }

  // DTP*472 — Service date
  if (claim.service_date) {
    lines.push(`DTP${delim}472${delim}D8${delim}${claim.service_date}${term}`);
  }

  // SV1 — Procedure codes
  if (claim.procedure_codes) {
    for (const proc of claim.procedure_codes) {
      lines.push(`SV1${delim}HC:${proc}${delim}${claim.total_charge || 0}${delim}UN${delim}1${term}`);
    }
  }

  // SE
  const segCount = lines.length + 1; // +1 for SE itself
  lines.push(`SE${delim}${segCount}${delim}0001${term}`);

  // GE
  lines.push(`GE${delim}1${delim}1${term}`);

  // IEA
  lines.push(`IEA${delim}1${delim}000000001${term}`);

  return lines.join('\n');
}
