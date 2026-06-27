import { useState } from 'react';
import type { RepairAction, RepairSession } from '../types/repair';
import ReviewCard from './ReviewCard';

interface Props {
  session: RepairSession;
  onApprove: (errorId: string) => void;
  onReject: (errorId: string) => void;
  onCertify: () => void;
  allReviewed: boolean;
}

export default function TriageDashboard({
  session,
  onApprove,
  onReject,
  onCertify,
  allReviewed,
}: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>('pending');

  const autoApplied = session.actions.filter((a) => a.status === 'auto_applied');
  const pending = session.actions.filter((a) => a.status === 'pending_review');
  const reviewed = session.actions.filter(
    (a) => a.status === 'approved' || a.status === 'rejected',
  );
  const noFix = session.actions.filter((a) => a.status === 'no_fix');

  const toggleSection = (key: string) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        <SummaryCard
          icon="🔧"
          label="Auto-Fixed"
          count={session.auto_applied}
          color="var(--accent-green)"
          bgColor="rgba(16, 185, 129, 0.08)"
          borderColor="rgba(16, 185, 129, 0.2)"
        />
        <SummaryCard
          icon="👁"
          label="Pending Review"
          count={pending.length}
          color="var(--accent-yellow)"
          bgColor="rgba(245, 158, 11, 0.08)"
          borderColor="rgba(245, 158, 11, 0.2)"
        />
        <SummaryCard
          icon="✓"
          label="Reviewed"
          count={reviewed.length}
          color="var(--accent-blue)"
          bgColor="rgba(59, 130, 246, 0.08)"
          borderColor="rgba(59, 130, 246, 0.2)"
        />
        <SummaryCard
          icon="⊘"
          label="Unfixable"
          count={session.no_fix}
          color="var(--text-muted)"
          bgColor="rgba(100, 116, 139, 0.08)"
          borderColor="rgba(100, 116, 139, 0.2)"
        />
      </div>

      {/* Session info */}
      <div
        className="glass-card"
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Session:{' '}
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
              {session.session_id.slice(0, 8)}…
            </span>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Doc:{' '}
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
              {session.document_id.slice(0, 8)}…
            </span>
          </span>
        </div>
        <button
          onClick={onCertify}
          disabled={!allReviewed}
          style={{
            padding: '8px 24px',
            borderRadius: '10px',
            border: 'none',
            background: allReviewed
              ? 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))'
              : 'var(--bg-card)',
            color: allReviewed ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: allReviewed ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: allReviewed ? '0 4px 20px rgba(16, 185, 129, 0.3)' : 'none',
            opacity: allReviewed ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (allReviewed) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(16, 185, 129, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            if (allReviewed)
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
          }}
        >
          🏆 Certify & Finalize
        </button>
      </div>

      {/* Pending Review Section */}
      {pending.length > 0 && (
        <CollapsibleSection
          title="⚠ Pending Your Review"
          count={pending.length}
          color="var(--accent-yellow)"
          isOpen={expandedSection === 'pending'}
          onToggle={() => toggleSection('pending')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pending.map((action) => (
              <ReviewCard
                key={action.error_id}
                action={action}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Reviewed Section */}
      {reviewed.length > 0 && (
        <CollapsibleSection
          title="✓ Reviewed"
          count={reviewed.length}
          color="var(--accent-blue)"
          isOpen={expandedSection === 'reviewed'}
          onToggle={() => toggleSection('reviewed')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reviewed.map((action) => (
              <ActionRow key={action.error_id} action={action} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Auto-Applied Section */}
      {autoApplied.length > 0 && (
        <CollapsibleSection
          title="🔧 Auto-Applied Fixes"
          count={autoApplied.length}
          color="var(--accent-green)"
          isOpen={expandedSection === 'auto'}
          onToggle={() => toggleSection('auto')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {autoApplied.map((action) => (
              <ActionRow key={action.error_id} action={action} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* No Fix Section */}
      {noFix.length > 0 && (
        <CollapsibleSection
          title="⊘ Unfixable Errors"
          count={noFix.length}
          color="var(--text-muted)"
          isOpen={expandedSection === 'nofix'}
          onToggle={() => toggleSection('nofix')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {noFix.map((action) => (
              <ActionRow key={action.error_id} action={action} />
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

/* ─── Helper Components ─── */

function SummaryCard({
  icon,
  label,
  count,
  color,
  bgColor,
  borderColor,
}: {
  icon: string;
  label: string;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: bgColor,
        borderColor,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${bgColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 800, color, lineHeight: 1 }}>
          {count}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontWeight: 500,
            marginTop: '2px',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  color,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        <span>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              background: color,
              color: '#fff',
              padding: '2px 10px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {count}
          </span>
          <span
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            ▼
          </span>
        </div>
      </button>
      {isOpen && (
        <div
          style={{
            padding: '0 20px 20px',
            borderTop: '1px solid var(--border-primary)',
            paddingTop: '16px',
          }}
          className="animate-fade-in"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ActionRow({ action }: { action: RepairAction }) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    auto_applied: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', label: 'Auto-Fixed' },
    approved: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', label: 'Approved' },
    rejected: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', label: 'Rejected' },
    no_fix: { bg: 'rgba(100, 116, 139, 0.12)', text: '#94a3b8', label: 'No Fix' },
    pending_review: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', label: 'Pending' },
  };

  const s = statusColors[action.status] || statusColors.pending_review;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: '8px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        fontSize: '13px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <span
          style={{
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {action.field}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          {action.rule_violated.slice(0, 60)}
          {action.rule_violated.length > 60 ? '…' : ''}
        </span>
      </div>
      <span
        style={{
          padding: '3px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          background: s.bg,
          color: s.text,
        }}
      >
        {s.label}
      </span>
    </div>
  );
}
