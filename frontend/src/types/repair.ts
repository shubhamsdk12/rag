/* ─── Phase 2 Repair Types ─── */

export type RepairCategoryType = 'safe_fix' | 'risky_fix' | 'no_fix';

export interface TriageResult {
  error_id: string;
  category: RepairCategoryType;
  reason: string;
}

export interface RepairAction {
  error_id: string;
  category: RepairCategoryType;
  original_segment: string;
  proposed_segment: string;
  fix_description: string;
  status: 'auto_applied' | 'pending_review' | 'approved' | 'rejected' | 'no_fix';
  reviewed_by: string | null;
  reviewed_at: string | null;
  error_type: string;
  field: string;
  rule_violated: string;
  severity: string;
  llm_explanation: string;
  suggested_fix: string;
}

export interface RepairSession {
  session_id: string;
  document_id: string;
  job_id: string;
  auto_applied: number;
  pending_review: number;
  no_fix: number;
  actions: RepairAction[];
}

export interface QueueResponse {
  session_id: string;
  pending_count: number;
  actions: RepairAction[];
}

export interface AuditCertificate {
  session_id: string;
  document_id: string;
  job_id: string;
  certified_at: string;
  total_errors_found: number;
  auto_applied: number;
  human_approved: number;
  human_rejected: number;
  no_fix: number;
  actions: RepairAction[];
  pipeline_result: Record<string, unknown>;
  status: string;
}

/* Pipeline ingest result (Phase 1) */
export interface PipelineError {
  result_id: string;
  error_type: string;
  field: string;
  value: string;
  rule_violated: string;
  llm_explanation: string;
  severity: string;
  triage_category: string;
  status: string;
  suggested_fix: string;
}

export interface PipelineResult {
  status: string;
  filename: string;
  doc_id: string;
  job_id: string;
  compliance_score: number;
  total_errors: number;
  errors: PipelineError[];
  summary: string;
}
