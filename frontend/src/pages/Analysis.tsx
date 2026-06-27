import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GitBranch, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { getQueue, approveAction, rejectAction, certifySession, startRepair } from '../api/repair';
import type { IngestResponse, RepairSession, AnalysisError, RepairAction } from '../types';
import TopBar from '../components/layout/TopBar';
import ErrorState from '../components/shared/ErrorState';
import { SkeletonCard } from '../components/shared/SkeletonLoader';
import ComplianceRing from '../components/shared/ComplianceRing';
import FormatBadge from '../components/shared/FormatBadge';
import StatusBadge from '../components/shared/StatusBadge';
import ErrorList from '../components/analysis/ErrorList';
import ErrorDetail from '../components/analysis/ErrorDetail';
import AuditVisualizer from '../components/AuditVisualizer'; // Reusing existing visualizer if possible or importing it

export default function Analysis() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { sessions, analyses, setSession, refreshPendingCount, certificates, setCertificate } = useAppState();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState<RepairSession | null>(null);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [step0Collapsed, setStep0Collapsed] = useState(true);
  const [certifying, setCertifying] = useState(false);

  // Filter states for error list
  const [activeFilter, setActiveFilter] = useState<'all' | 'error' | 'warning' | 'risky'>('all');
  const [activeSourceFilter, setActiveSourceFilter] = useState<'all' | 'parser' | 'snip' | 'graph' | 'semantic'>('all');

  const analysisResult: IngestResponse | undefined = documentId ? analyses[documentId] : undefined;
  const sessionId = documentId ? sessions[documentId] : undefined;

  const fetchSession = async (sId: string) => {
    try {
      const q = await getQueue(sId);
      // Map queue actions to repair actions structure
      setSessionData({
        session_id: q.session_id,
        document_id: documentId || '',
        auto_applied: sessionData?.auto_applied ?? 0,
        pending_review: q.pending_count,
        no_fix: sessionData?.no_fix ?? 0,
        actions: q.actions,
      });

      if (q.actions.length > 0 && !selectedErrorId) {
        setSelectedErrorId(q.actions[0].error_id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch active repair queue.');
    }
  };

  const initWorkspace = async () => {
    if (!documentId) return;
    setLoading(true);
    setError('');

    try {
      // If we don't have analysis cached, it means page refresh. We can't continue without it.
      if (!analysisResult) {
        setError('Document analysis not found. Please upload the file again.');
        setLoading(false);
        return;
      }

      // If we don't have active session in state, start a new repair session or reuse
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const session = await startRepair(documentId);
        setSession(documentId, session.session_id);
        activeSessionId = session.session_id;
        setSessionData(session);
        if (session.actions.length > 0) {
          setSelectedErrorId(session.actions[0].error_id);
        }
      } else {
        await fetchSession(activeSessionId);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to initialize repair session workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initWorkspace();
  }, [documentId]);

  const handleApprove = async (errorId: string) => {
    if (!sessionId) return;
    try {
      await approveAction(sessionId, errorId, 'compliance_officer');
      // Update local state status
      setSessionData((prev: RepairSession | null) => {
        if (!prev) return null;
        return {
          ...prev,
          pending_review: Math.max(prev.pending_review - 1, 0),
          actions: prev.actions.map((act: RepairAction) =>
            act.error_id === errorId
              ? { ...act, status: 'approved' as const, reviewed_by: 'compliance_officer', reviewed_at: new Date().toISOString() }
              : act
          ),
        };
      });
      refreshPendingCount();
    } catch (e: any) {
      setError(e.message || 'Approval request failed.');
    }
  };

  const handleReject = async (errorId: string, reason: string) => {
    if (!sessionId) return;
    try {
      await rejectAction(sessionId, errorId, 'compliance_officer', reason);
      // Update local state status
      setSessionData((prev: RepairSession | null) => {
        if (!prev) return null;
        return {
          ...prev,
          pending_review: Math.max(prev.pending_review - 1, 0),
          actions: prev.actions.map((act: RepairAction) =>
            act.error_id === errorId
              ? { ...act, status: 'rejected' as const, reviewed_by: 'compliance_officer', reviewed_at: new Date().toISOString() }
              : act
          ),
        };
      });
      refreshPendingCount();
    } catch (e: any) {
      setError(e.message || 'Rejection request failed.');
    }
  };

  const handleCertify = async () => {
    if (!sessionId) return;
    setCertifying(true);
    try {
      const cert = await certifySession(sessionId);
      setCertificate(sessionId, cert);
      setSessionData((prev: RepairSession | null) => {
        if (!prev) return null;
        return { ...prev, pending_review: 0 };
      });
    } catch (e: any) {
      setError(e.message || 'Certification failed. Ensure all pending actions are resolved.');
    } finally {
      setCertifying(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Analysis' }]} showStatus={false} />
        <SkeletonCard />
        <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '20px' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !analysisResult || !sessionData) {
    return (
      <div className="page-content">
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Analysis' }]} showStatus={false} />
        <ErrorState message={error || 'Document not found. Please upload file again.'} onRetry={() => navigate('/ingest')} />
      </div>
    );
  }

  const certificateReady = certificates[sessionId || ''] !== undefined;
  const certificateData = certificates[sessionId || ''];

  if (certificateReady && certificateData) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <TopBar breadcrumbs={[{ label: 'IntelliFix', to: '/dashboard' }, { label: 'Analysis' }, { label: 'Audit Certificate' }]} />
        <AuditVisualizer certificate={certificateData} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const allReviewed = sessionData.actions.filter((a: RepairAction) => a.status === 'pending_review').length === 0;

  // Map analysisResult errors to contain extra session metadata
  const mappedErrors: AnalysisError[] = analysisResult.errors.map((err: AnalysisError) => {
    const act = sessionData.actions.find((a: RepairAction) => a.error_id === err.error_id);
    return {
      ...err,
      triage_category: act?.category,
      triage_status: act?.status,
    };
  });

  const selectedError = mappedErrors.find((e: AnalysisError) => e.error_id === selectedErrorId);
  const selectedAction = sessionData.actions.find((a: RepairAction) => a.error_id === selectedErrorId);

  // Industry color mapping
  const industryColors: Record<string, string> = {
    Healthcare: 'badge-healthcare',
    Banking: 'badge-banking',
    Insurance: 'badge-insurance',
    'Enterprise SaaS': 'badge-enterprise',
  };

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Analysis' }]} />

      {/* Document Header */}
      <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {analysisResult.filename}
            </span>
            <FormatBadge format={analysisResult.format} />
            <span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>
              {analysisResult.schema_type}
            </span>
            <span className={`badge ${industryColors[analysisResult.industry] || 'badge-info'}`}>
              {analysisResult.industry}
            </span>
            <StatusBadge variant={allReviewed ? 'Certified' : 'Pending Review'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              June 25, 2024, 08:02 PM
            </span>
            <span>
              Doc ID:{' '}
              <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                {analysisResult.document_id}
              </span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ComplianceRing score={analysisResult.compliance_score} size={72} strokeWidth={6} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to={`/graph/${analysisResult.document_id}`} style={{ textDecoration: 'none' }}>
              <button className="btn btn-ghost" style={{ gap: '6px', width: '100%' }}>
                <GitBranch size={16} />
                View Graph
              </button>
            </Link>
            <button
              onClick={handleCertify}
              disabled={!allReviewed || certifying}
              className="btn btn-success"
              style={{ gap: '6px', cursor: allReviewed ? 'pointer' : 'not-allowed' }}
              title={!allReviewed ? 'Review all pending fixes before certifying.' : 'Certify and finalize'}
            >
              Generate Audit Report
            </button>
          </div>
        </div>
      </div>

      {/* Step 0 Collapsible Banner */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <button
          onClick={() => setStep0Collapsed(!step0Collapsed)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(245, 158, 11, 0.05)',
            border: 'none',
            borderBottom: !step0Collapsed ? '1px solid var(--border)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {step0Collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            ⚡ Step 0 Complete — {analysisResult.step0_ruleset}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Click to view loaded rulesets
          </span>
        </button>

        {!step0Collapsed && (
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
            <Step0Metric label="Schema" count={analysisResult.step0_rules_checked.schema} />
            <Step0Metric label="Business Rules" count={analysisResult.step0_rules_checked.business_rules} />
            <Step0Metric label="Regulatory" count={analysisResult.step0_rules_checked.regulatory} />
            <Step0Metric label="Cross-Field" count={analysisResult.step0_rules_checked.cross_field} />
            <Step0Metric label="Master Data" count={analysisResult.step0_rules_checked.master_data} />
          </div>
        )}
      </div>

      {/* Two-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '20px', alignItems: 'start' }}>
        {/* Left: Error List */}
        <div>
          <ErrorList
            errors={mappedErrors}
            selectedErrorId={selectedErrorId}
            onSelectError={setSelectedErrorId}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            activeSourceFilter={activeSourceFilter}
            setActiveSourceFilter={setActiveSourceFilter}
          />
        </div>

        {/* Right: Error Details */}
        <div>
          {selectedError ? (
            <ErrorDetail
              error={selectedError}
              repairAction={selectedAction}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ) : (
            <div className="card" style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select an error from the list to view explanation and apply repair triage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step0Metric({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{count} checked</span>
    </div>
  );
}
