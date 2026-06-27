import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Database,
  Loader2,
} from 'lucide-react';
import type { GlobalQueueAction } from '../types';
import { getGlobalQueue, approveAction, rejectAction } from '../api/repair';
import { useAppState } from '../context/AppContext';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/shared/KpiCard';
import StatusBadge from '../components/shared/StatusBadge';
import ConfidencePill from '../components/shared/ConfidencePill';
import FormatBadge from '../components/shared/FormatBadge';
import { SkeletonTable } from '../components/shared/SkeletonLoader';
import ErrorState from '../components/shared/ErrorState';

export default function TriageQueue() {
  const navigate = useNavigate();
  const { refreshPendingCount } = useAppState();

  const [actions, setActions] = useState<GlobalQueueAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Track inline inputs
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Track fading out rows
  const [fadingIds, setFadingIds] = useState<string[]>([]);

  const fetchQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGlobalQueue();
      setActions(res.actions);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch global review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (action: GlobalQueueAction) => {
    if (!action.session_id) return;
    setSubmittingId(action.error_id);
    try {
      await approveAction(action.session_id, action.error_id, 'compliance_officer');
      // Trigger fade animation
      setFadingIds((prev) => [...prev, action.error_id]);
      setTimeout(() => {
        setActions((prev) => prev.filter((a) => a.error_id !== action.error_id));
        setFadingIds((prev) => prev.filter((id) => id !== action.error_id));
      }, 300);
      refreshPendingCount();
    } catch (e: any) {
      setError(e.message || 'Failed to approve action.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectSubmit = async (action: GlobalQueueAction) => {
    if (!action.session_id || !rejectReason.trim()) return;
    setSubmittingId(action.error_id);
    try {
      await rejectAction(action.session_id, action.error_id, 'compliance_officer', rejectReason);
      // Trigger fade animation
      setFadingIds((prev) => [...prev, action.error_id]);
      setTimeout(() => {
        setActions((prev) => prev.filter((a) => a.error_id !== action.error_id));
        setFadingIds((prev) => prev.filter((id) => id !== action.error_id));
        setRejectId(null);
        setRejectReason('');
      }, 300);
      refreshPendingCount();
    } catch (e: any) {
      setError(e.message || 'Failed to reject action.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Triage Queue' }]} showStatus={false} />
        <SkeletonTable />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Triage Queue' }]} showStatus={false} />
        <ErrorState message={error} onRetry={fetchQueue} />
      </div>
    );
  }

  // Calculate quick stats
  const pendingCount = actions.length;
  const autoAppliedCount = Math.round(pendingCount * 1.5); // Mock stats
  const rejectedTodayCount = 0;
  const kgEntriesToday = pendingCount * 4;

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Triage Queue' }]} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Human Review Queue</h2>
        <span className="badge badge-pending" style={{ fontSize: '13px', fontWeight: 700, padding: '2px 10px', borderRadius: '10px' }}>
          {pendingCount} pending
        </span>
      </div>

      {/* KPI summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <KpiCard
          label="PENDING REVIEW"
          value={pendingCount}
          icon={<AlertTriangle size={20} color="var(--accent-orange)" />}
          valueColor="var(--accent-orange)"
        />
        <KpiCard
          label="APPROVED TODAY"
          value={autoAppliedCount}
          icon={<CheckCircle size={20} color="var(--accent-green)" />}
          valueColor="var(--accent-green)"
        />
        <KpiCard
          label="REJECTED TODAY"
          value={rejectedTodayCount}
          icon={<X size={20} color="var(--accent-red)" />}
          valueColor="var(--accent-red)"
        />
        <KpiCard
          label="KG ENTRIES ADDED TODAY"
          value={kgEntriesToday}
          subtext="From approved fixes"
          icon={<Database size={20} color="var(--accent-purple)" />}
          valueColor="var(--accent-purple)"
        />
      </div>

      {/* Triage Queue Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {actions.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No pending review actions. All documents certified!
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr className="table-header" style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Document</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Schema</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Error Code</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Violated Rule</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Message</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Impact</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>AI Suggested Fix</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Confidence</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => {
                  const isFading = fadingIds.includes(act.error_id);
                  const isSubmitting = submittingId === act.error_id;

                  return (
                    <tr
                      key={act.error_id}
                      className="table-row"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                        opacity: isFading ? 0 : 1,
                        transform: isFading ? 'translateY(-10px)' : 'none',
                      }}
                    >
                      <td style={{ padding: '16px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span
                          onClick={() => act.document_id && navigate(`/analysis/${act.document_id}`)}
                          style={{
                            color: 'var(--accent-purple)',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {act.filename || 'claim_batch.edi'}
                        </span>
                        {act.format && (
                          <div style={{ marginTop: '4px' }}>
                            <FormatBadge format={act.format} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace' }}>{act.schema_type || '837P'}</td>
                      <td style={{ padding: '16px', fontWeight: 600, fontFamily: 'monospace' }}>{act.error_id}</td>
                      <td style={{ padding: '16px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={act.rule_violated || act.fix_description}>
                        {act.rule_violated || act.fix_description}
                      </td>
                      <td style={{ padding: '16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={act.llm_explanation || act.fix_description}>
                        {act.llm_explanation || act.fix_description}
                      </td>
                      <td style={{ padding: '16px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={act.explanation?.impact_preview.compliance_impact || 'Reduces denial risk'}>
                        {act.explanation?.impact_preview.compliance_impact || 'Reduces denial risk'}
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace' }}>
                        {act.proposed_segment ? (
                          <span className="badge badge-info">{act.proposed_segment}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <ConfidencePill confidence={act.category === 'safe_fix' ? 'high' : act.category === 'risky_fix' ? 'medium' : 'low'} />
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <StatusBadge variant="pending_review" />
                      </td>
                      <td style={{ padding: '16px' }}>
                        {rejectId === act.error_id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
                            <input
                              type="text"
                              placeholder="Reason..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                fontSize: '11px',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setRejectId(null);
                                  setRejectReason('');
                                }}
                                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleRejectSubmit(act)}
                                disabled={isSubmitting || !rejectReason.trim()}
                                style={{
                                  border: 'none',
                                  background: 'var(--accent-red)',
                                  color: '#fff',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApprove(act)}
                              disabled={isSubmitting}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--accent-green)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent-green)';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                e.currentTarget.style.color = 'var(--accent-green)';
                              }}
                              title="Approve Fix"
                            >
                              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={() => setRejectId(act.error_id)}
                              disabled={isSubmitting}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--accent-red)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent-red)';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.color = 'var(--accent-red)';
                              }}
                              title="Reject Fix"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
