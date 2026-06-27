import { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingDown,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import type { DocumentSummary, AnalyticsSummary } from '../types';
import { getRecentDocuments } from '../api/documents';
import { getAnalyticsSummary } from '../api/analytics';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/shared/KpiCard';
import ComplianceRing from '../components/shared/ComplianceRing';
import DocumentTable from '../components/shared/DocumentTable';
import { SkeletonCard, SkeletonTable } from '../components/shared/SkeletonLoader';
import ErrorState from '../components/shared/ErrorState';

export default function Dashboard() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [docsData, analyticsData] = await Promise.all([
        getRecentDocuments(10),
        getAnalyticsSummary(),
      ]);
      setDocuments(docsData);
      setAnalytics(analyticsData);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Dashboard' }]} showStatus={false} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Dashboard' }]} showStatus={false} />
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  // Fallback defaults if API returns empty
  const totalProcessed = analytics?.total_processed ?? 0;
  const certifiedToday = analytics?.certified_today ?? 0;
  const pendingCount = documents.filter((d) => d.status === 'Pending Review').length;
  const manualEffortReduced = analytics?.manual_effort_reduced ?? 0;

  // Calculate average compliance score across all docs
  const avgCompliance = documents.length
    ? Math.round(documents.reduce((acc: number, curr: DocumentSummary) => acc + curr.compliance_score, 0) / documents.length)
    : 0;

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Dashboard' }]} />

      {/* Row 1 KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <KpiCard
          label="DOCUMENTS PROCESSED"
          value={totalProcessed}
          subtext="Last 30 days"
          icon={<FileText size={24} color="var(--accent-blue)" />}
        />
        <KpiCard
          label="CERTIFIED TODAY"
          value={certifiedToday}
          subtext={`${analytics?.most_auto_repaired?.[0]?.count ?? 0} errors auto-fixed`}
          icon={<CheckCircle size={24} color="var(--accent-green)" />}
          valueColor="var(--accent-green)"
        />
        <KpiCard
          label="PENDING REVIEW"
          value={pendingCount}
          subtext="Awaiting human approval"
          icon={<AlertTriangle size={24} color="var(--accent-orange)" />}
          valueColor="var(--accent-orange)"
        />
      </div>

      {/* Row 2 KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Compliance ring card */}
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="section-header" style={{ fontSize: '11px' }}>AVG COMPLIANCE SCORE</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Across all documents</span>
          </div>
          <ComplianceRing score={avgCompliance} size={80} strokeWidth={6} />
        </div>

        <KpiCard
          label="ERRORS AUTO-FIXED"
          value={analytics?.most_auto_repaired?.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0) ?? 0}
          subtext="Autonomous repair agent"
          icon={<Zap size={24} color="var(--accent-purple)" />}
          valueColor="var(--accent-purple)"
        />
        <KpiCard
          label="MANUAL EFFORT REDUCED"
          value={`${Math.round(manualEffortReduced * 100)}%`}
          subtext="vs. manual review"
          icon={<TrendingDown size={24} color="var(--accent-teal)" />}
          valueColor="var(--accent-teal)"
        />
      </div>

      {/* Supported Industries Bar */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="section-header" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>SUPPORTED INDUSTRIES:</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-healthcare">Healthcare</span>
          <span className="badge badge-banking">Banking</span>
          <span className="badge badge-insurance">Insurance</span>
          <span className="badge badge-enterprise">Enterprise SaaS</span>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        {/* Left Area Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <span className="section-header" style={{ display: 'block', marginBottom: '16px' }}>Compliance Score Trend (7 days)</span>
          <div style={{ width: '100%', height: 260 }}>
            {analytics?.compliance_trend ? (
              <ResponsiveContainer>
                <AreaChart data={analytics.compliance_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis domain={[60, 100]} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
                  />
                  <CartesianGrid vertical={false} stroke="var(--border-light)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="score" stroke="var(--accent-blue)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No trend data available.
              </div>
            )}
          </div>
        </div>

        {/* Right Bar Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <span className="section-header" style={{ display: 'block', marginBottom: '16px' }}>Errors by Source</span>
          <div style={{ width: '100%', height: 260 }}>
            {analytics?.error_type_breakdown ? (
              <ResponsiveContainer>
                <BarChart data={analytics.error_type_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="source" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
                  />
                  <CartesianGrid vertical={false} stroke="var(--border-light)" strokeDasharray="3 3" />
                  <Bar dataKey="count" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No error source breakdown available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div>
        <span className="section-header" style={{ display: 'block', marginBottom: '12px' }}>Recent Documents</span>
        {documents.length > 0 ? (
          <DocumentTable documents={documents} />
        ) : (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No documents available. Go to ingest to load a validation document.
          </div>
        )}
      </div>
    </div>
  );
}
