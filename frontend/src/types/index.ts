/* ─── IntelliFix AI — Consolidated Type Definitions ─── */

/* ─── Document Types ─── */
export interface DocumentSummary {
  document_id: string;
  filename: string;
  format: string;
  schema_type: string;
  industry: string;
  compliance_score: number;
  status: 'Certified' | 'Pending Review' | 'Processing' | 'Error';
  knowledge_ruleset: string;
  analyzed_at: string;
  session_id?: string;
}

/* ─── Analysis Error ─── */
export interface AnalysisError {
  error_id: string;
  code: string;
  severity: 'error' | 'warning';
  source: 'parser' | 'snip' | 'graph' | 'semantic';
  message: string;
  segment_id?: string;
  element_index?: number;
  explanation: ErrorExplanation;
  triage_category?: 'safe_fix' | 'risky_fix' | 'no_fix';
  triage_status?: 'auto_applied' | 'pending_review' | 'approved' | 'rejected';
}

export interface ErrorExplanation {
  root_cause: string;
  violated_rule: string;
  violated_rule_code: string;
  regulation_reference?: string;
  suggested_fix?: string;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  reasoning: string;
  graphrag_context: {
    retrieved_rules: string[];
    related_entities: string[];
    historical_pattern?: string;
  };
  impact_preview: {
    affected_fields: string[];
    rules_at_risk: string[];
    compliance_impact: string;
    operational_impact: string;
  };
}

/* ─── Repair Types ─── */
export type RepairCategoryType = 'safe_fix' | 'risky_fix' | 'no_fix';

export interface RepairAction {
  error_id: string;
  category: RepairCategoryType;
  original_segment: string;
  proposed_segment: string;
  fix_description: string;
  status: 'auto_applied' | 'pending_review' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  error_type?: string;
  field?: string;
  rule_violated?: string;
  severity?: string;
  llm_explanation?: string;
  suggested_fix?: string;
  explanation?: ErrorExplanation;
}

export interface RepairSession {
  session_id: string;
  document_id: string;
  job_id?: string;
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

export interface GlobalQueueAction extends RepairAction {
  document_id?: string;
  session_id?: string;
  filename?: string;
  format?: string;
  schema_type?: string;
}

export interface GlobalQueueResponse {
  total_pending: number;
  actions: GlobalQueueAction[];
}

/* ─── Audit Certificate ─── */
export interface AuditCertificate {
  session_id: string;
  document_id: string;
  schema_type?: string;
  certified_at: string;
  total_errors_found: number;
  auto_applied: number;
  human_approved: number;
  human_rejected: number;
  no_fix: number;
  actions: RepairAction[];
  certified_payload?: Record<string, unknown>;
  pipeline_result?: Record<string, unknown>;
  status: string;
  job_id?: string;
}

/* ─── Ingest Response ─── */
export interface IngestResponse {
  document_id: string;
  filename: string;
  schema_type: string;
  format: string;
  industry: string;
  compliance_score: number;
  errors: AnalysisError[];
  step0_ruleset: string;
  step0_rules_checked: {
    schema: number;
    business_rules: number;
    regulatory: number;
    cross_field: number;
    master_data: number;
  };
  processing_time_ms: number;
  ir?: Record<string, unknown>;
  /* Legacy fields from Phase 1 pipeline */
  status?: string;
  doc_id?: string;
  job_id?: string;
  total_errors?: number;
  summary?: string;
}

/* ─── Graph Types ─── */
export interface GraphNode {
  id: string;
  type: 'Patient' | 'Provider' | 'Claim' | 'Service' | 'Payment';
  label: string;
  properties: Record<string, string>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  style: 'normal' | 'flagged' | 'cross_doc';
}

export interface GraphData {
  document_id: string;
  cross_document_links: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/* ─── Health ─── */
export interface HealthResponse {
  status: string;
  neo4j_connected: boolean;
  chromadb_ready: boolean;
}

/* ─── Analytics ─── */
export interface AnalyticsSummary {
  total_processed: number;
  certified_today: number;
  auto_fix_rate: number;
  avg_time_saved_minutes: number;
  manual_effort_reduced: number;
  knowledge_graph_entries: number;
  compliance_trend: { date: string; score: number }[];
  industry_distribution: { industry: string; count: number }[];
  error_type_breakdown: { source: string; count: number }[];
  confidence_distribution: { level: 'high' | 'medium' | 'low'; count: number }[];
  top_violated_rules: {
    rule_code: string;
    count: number;
    auto_fix_rate: number;
  }[];
  most_auto_repaired: {
    rule_code: string;
    count: number;
  }[];
}

/* ─── Knowledge Base ─── */
export interface KnowledgeEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  used_count: number;
  source_file?: string;
  created_at?: string;
}

export interface KnowledgeInitStatus {
  initialized: boolean;
  rulesets_loaded: number;
  total_rules: number;
  historical_corrections: number;
}

/* ─── App State ─── */
export interface AppState {
  sessions: Record<string, string>;
  analyses: Record<string, IngestResponse>;
  certificates: Record<string, AuditCertificate>;
  pendingCount: number;
  healthStatus: HealthResponse | null;
  currentUser: string;
  sidebarCollapsed: boolean;
}

/* ─── Old / Legacy Validate/Parser/Delta Types ─── */
export interface Element {
  position: number;
  value: string;
  sub_elements: string[];
}

export interface Segment {
  segment_id: string;
  elements: Element[];
  raw: string;
  line_number: number;
  ui_label: string;
}

export interface Loop {
  loop_id: string;
  ui_label: string;
  segments: Segment[];
  children: Loop[];
}

export interface EnvelopeInfo {
  interchange_control_number: string;
  sender_id: string;
  receiver_id: string;
  functional_group_control_number: string;
  transaction_set_control_number: string;
  gs_code: string;
  st_code: string;
  isa_date: string;
  isa_time: string;
}

export interface Delimiters {
  element_separator: string;
  sub_element_separator: string;
  segment_terminator: string;
}

export interface ParseResult {
  transaction_type: string;
  envelope: EnvelopeInfo;
  loops: Loop[];
  segment_count: number;
  raw_segment_count: number;
  delimiters: Delimiters | null;
  metadata: Record<string, unknown>;
}

export interface ValidationError {
  segment_id: string;
  element_position: number | null;
  loop_id: string;
  snip_level: number;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  suggestion: string;
}

export interface ValidationSummary {
  snip1_errors: number;
  snip2_errors: number;
  snip3_errors: number;
  total_errors: number;
  total_warnings: number;
}

export interface ParseResponse {
  interchange_id: number;
  parse_result: ParseResult;
}

export interface ValidateResponse {
  interchange_id: number;
  parse_result: ParseResult;
  validation_errors: ValidationError[];
  summary: ValidationSummary;
}

export interface ReconciliationMatch {
  claim_id: string;
  billed_amount: number;
  paid_amount: number;
  patient_responsibility: number;
  total_adjustments: number;
  adjustment_codes: string;
  adjustment_groups: string;
  claim_status: string;
  status: string;
}

export interface ReconciliationReport {
  matched: ReconciliationMatch[];
  unmatched_claims: { claim_id: string; billed_amount: number; status: string }[];
  unmatched_remittances: { claim_id: string; billed_amount: number; paid_amount: number; status: string }[];
  summary: {
    total_matched: number;
    total_unmatched_claims: number;
    total_unmatched_remittances: number;
    total_billed: number;
    total_paid: number;
    total_adjustments: number;
    net_difference: number;
  };
}

export interface DeltaMember {
  subscriber_id: string;
  name: string;
  status: string;
  maintenance_code?: string;
  insurance_type?: string;
  benefit_start?: string;
  benefit_end?: string;
  changes?: { field: string; old_value: string; new_value: string }[];
}

export interface DeltaReport {
  added: DeltaMember[];
  terminated: DeltaMember[];
  changed: DeltaMember[];
  unchanged_count: number;
  summary: {
    total_added: number;
    total_terminated: number;
    total_changed: number;
    total_unchanged: number;
  };
}

export interface ExplainResponse {
  error_code: string;
  snip_level: number;
  severity: string;
  plain_english: string;
  regulatory_context: string[];
  suggested_fix: string;
  sources: string[];
}

export type ActiveView = 'upload' | 'validate' | 'intellifix' | 'reconcile' | 'delta';
