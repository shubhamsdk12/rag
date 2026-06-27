import { useState } from 'react';
import type { AnalysisError, RepairAction } from '../../types';
import StatusBadge from '../shared/StatusBadge';
import GraphRagContext from './GraphRagContext';
import ImpactPreview from './ImpactPreview';
import ProposedFix from './ProposedFix';
import ConfidencePill from '../shared/ConfidencePill';

interface ErrorDetailProps {
  error: AnalysisError;
  repairAction?: RepairAction;
  onApprove: (errorId: string) => Promise<void>;
  onReject: (errorId: string, reason: string) => Promise<void>;
}

export default function ErrorDetail({ error, repairAction, onApprove, onReject }: ErrorDetailProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = repairAction?.status || error.triage_status || 'pending_review';
  const category = repairAction?.category || error.triage_category || 'no_fix';
  const explanation = error.explanation;

  const handleApproveClick = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(error.error_id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = async () => {
    if (!isRejecting) {
      setIsRejecting(true);
      return;
    }
    if (!rejectReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onReject(error.error_id, rejectReason);
      setIsRejecting(false);
      setRejectReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        height: '100%',
        overflowY: 'auto',
        maxHeight: '750px',
      }}
    >
      {/* Section 1: Error Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
            {error.code}
          </span>
          <StatusBadge variant={status} />
          <span className="badge badge-info">{error.source.toUpperCase()}</span>
          {error.segment_id && (
            <span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>
              {error.segment_id}
              {error.element_index !== undefined ? `0${error.element_index}` : ''}
            </span>
          )}
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {error.message}
        </h2>
      </div>

      {/* Section 2: Violated Business / Regulatory Rule */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span
          className="section-header"
          style={{ fontSize: '10px', color: 'var(--accent-red)', fontWeight: 700 }}
        >
          ⚠ VIOLATED BUSINESS / REGULATORY RULE
        </span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
          {explanation.violated_rule_code}: {explanation.violated_rule}
        </span>
      </div>

      {/* Section 3: Root Cause */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="section-header">ROOT CAUSE</span>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
          {explanation.root_cause}
        </p>
      </div>

      {/* Section 4: GraphRAG Context */}
      <GraphRagContext context={explanation.graphrag_context} />

      {/* Section 5: AI Reasoning Chain */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(124, 58, 237, 0.03)',
          border: '1px solid rgba(124, 58, 237, 0.1)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <span
          className="section-header"
          style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 700 }}
        >
          ⚡ AI REASONING CHAIN
        </span>
        <p
          style={{
            margin: 0,
            color: 'var(--text-secondary)',
            fontSize: '13px',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          {explanation.reasoning}
        </p>
      </div>

      {/* Section 6: Regulation Reference Pill + Confidence */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {explanation.regulation_reference ? (
          <span
            style={{
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            {explanation.regulation_reference}
          </span>
        ) : (
          <div />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Confidence:</span>
          <ConfidencePill confidence={explanation.confidence} score={explanation.confidence_score} />
        </div>
      </div>

      {/* Section 7: Impact Preview */}
      <ImpactPreview preview={explanation.impact_preview} />

      {/* Section 8: Proposed Fix */}
      {repairAction && category !== 'no_fix' && (
        <ProposedFix
          original={repairAction.original_segment}
          proposed={repairAction.proposed_segment}
          status={status}
          onApprove={handleApproveClick}
          onReject={handleRejectClick}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          isRejecting={isRejecting}
          setIsRejecting={setIsRejecting}
          disabled={isSubmitting}
        />
      )}
    </div>
  );
}
