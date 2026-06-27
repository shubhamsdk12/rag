import { useState } from 'react';
import type { RepairAction } from '../types/repair';

interface Props {
  action: RepairAction;
  onApprove: (errorId: string) => void;
  onReject: (errorId: string) => void;
}

export default function ReviewCard({ action, onApprove, onReject }: Props) {
  const [decided, setDecided] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);

  const handleApprove = () => {
    setDecided(true);
    setDecision('approved');
    onApprove(action.error_id);
  };

  const handleReject = () => {
    setDecided(true);
    setDecision('rejected');
    onReject(action.error_id);
  };

  return (
    <div
      className="glass-card overflow-hidden animate-fade-in"
      id={`review-card-${action.error_id}`}
      style={{ borderLeft: '3px solid var(--accent-yellow)' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-primary)',
          background: 'rgba(245, 158, 11, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              fontSize: '14px',
            }}
          >
            ⚠
          </span>
          <div>
            <span
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {action.field}
            </span>
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '12px',
                marginLeft: '8px',
              }}
            >
              {action.error_type}
            </span>
          </div>
        </div>
        <span
          className={`badge-${action.severity === 'critical' ? 'error' : 'warning'}`}
          style={{
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {action.severity}
        </span>
      </div>

      {/* Diff panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
        }}
      >
        {/* Original */}
        <div
          style={{
            padding: '16px 20px',
            borderRight: '1px solid var(--border-primary)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--accent-red)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)' }} />
            Original
          </div>
          <pre
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: '13px',
              lineHeight: '1.6',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: 'var(--text-primary)',
              overflow: 'auto',
              maxHeight: '120px',
            }}
          >
            {action.original_segment || '(empty)'}
          </pre>
        </div>

        {/* Proposed */}
        <div style={{ padding: '16px 20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--accent-green)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} />
            Suggested Fix
          </div>
          <pre
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: '13px',
              lineHeight: '1.6',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: 'var(--text-primary)',
              overflow: 'auto',
              maxHeight: '120px',
            }}
          >
            {action.proposed_segment || '(no suggestion)'}
          </pre>
        </div>
      </div>

      {/* Explanation */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-primary)',
          background: 'rgba(59, 130, 246, 0.03)',
        }}
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            lineHeight: '1.5',
            margin: '0 0 4px 0',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Rule:</strong>{' '}
          {action.rule_violated}
        </p>
        {action.fix_description && (
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '12px',
              margin: 0,
            }}
          >
            {action.fix_description}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
        }}
      >
        {decided ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background:
                decision === 'approved'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              color: decision === 'approved' ? '#34d399' : '#f87171',
              border: `1px solid ${
                decision === 'approved'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
            }}
          >
            {decision === 'approved' ? '✓ Approved' : '✗ Rejected'}
          </span>
        ) : (
          <>
            <button
              onClick={handleReject}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ✗ Reject
            </button>
            <button
              onClick={handleApprove}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25))',
                color: '#34d399',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.4))';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25))';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.15)';
              }}
            >
              ✓ Approve
            </button>
          </>
        )}
      </div>
    </div>
  );
}
