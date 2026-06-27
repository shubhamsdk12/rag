import type { AuditCertificate, RepairAction } from '../types';
import { irToEdi } from '../utils/ediSerializer';

interface Props {
  certificate: AuditCertificate;
}

export default function AuditVisualizer({ certificate }: Props) {
  const handleDownloadCertificate = () => {
    const json = JSON.stringify(certificate, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_certificate_${certificate.document_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEdi = () => {
    const payload = certificate.pipeline_result || {};
    const ediText = irToEdi(payload as Record<string, unknown>);
    const blob = new Blob([ediText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_${certificate.document_id}.edi`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    auto_applied: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', label: 'Auto-Fixed' },
    approved: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', label: 'Approved' },
    rejected: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', label: 'Rejected' },
    no_fix: { bg: 'rgba(100, 116, 139, 0.12)', text: '#94a3b8', label: 'No Fix' },
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '32px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background:
              'radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
            animation: 'pulse-glow 3s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            fontSize: '48px',
            marginBottom: '12px',
          }}
        >
          ✅
        </div>
        <h2
          style={{
            color: 'var(--accent-green)',
            fontSize: '22px',
            fontWeight: 800,
            margin: '0 0 6px 0',
            letterSpacing: '-0.3px',
          }}
        >
          Certified & Ready for Transmission
        </h2>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            margin: 0,
          }}
        >
          All errors have been reviewed and processed.
        </p>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
        }}
      >
        <StatCard
          label="Total Errors"
          value={certificate.total_errors_found}
          color="var(--text-primary)"
        />
        <StatCard
          label="Auto-Fixed"
          value={certificate.auto_applied}
          color="var(--accent-green)"
        />
        <StatCard
          label="Human Approved"
          value={certificate.human_approved}
          color="var(--accent-blue)"
        />
        <StatCard
          label="Rejected"
          value={certificate.human_rejected}
          color="var(--accent-red)"
        />
        <StatCard
          label="No Fix"
          value={certificate.no_fix}
          color="var(--text-muted)"
        />
      </div>

      {/* Actions Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-primary)',
            fontWeight: 600,
            fontSize: '14px',
            color: 'var(--text-primary)',
          }}
        >
          Repair Actions Summary
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-primary)',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>
                  Field
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>
                  Error Type
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>
                  Fix Applied
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>
                  Reviewed By
                </th>
              </tr>
            </thead>
            <tbody>
              {certificate.actions.map((action: RepairAction, i: number) => {
                const s = statusColors[action.status] || statusColors.no_fix;
                return (
                  <tr
                    key={action.error_id || i}
                    style={{
                      borderBottom: '1px solid var(--border-primary)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {action.field}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {action.error_type}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'var(--text-secondary)',
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {action.fix_description}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
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
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {action.reviewed_by || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={handleDownloadCertificate}
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
            color: 'var(--accent-blue)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          📄 Download Certificate
        </button>
        <button
          onClick={handleDownloadEdi}
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))',
            color: 'var(--accent-green)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          📦 Download Corrected EDI
        </button>
      </div>
    </div>
  );
}

/* ─── Helper ─── */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '16px 18px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontWeight: 500,
          marginTop: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
    </div>
  );
}
