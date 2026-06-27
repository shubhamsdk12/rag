import { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Zap,
  Clock,
  TrendingDown,
  Database,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
} from 'recharts';
import type { AnalyticsSummary } from '../types';
import { getAnalyticsSummary } from '../api/analytics';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/shared/KpiCard';
import { SkeletonTable } from '../components/shared/SkeletonLoader';
import ErrorState from '../components/shared/ErrorState';
import { formatPercentage } from '../utils/formatters';

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAnalyticsSummary();
      setAnalytics(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch analytics statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Analytics' }]} showStatus={false} />
        <SkeletonTable />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="page-content">
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Analytics' }]} showStatus={false} />
        <ErrorState message={error} onRetry={fetchAnalytics} />
      </div>
    );
  }

  // Pie chart colors
  const PIE_COLORS = ['var(--accent-green)', 'var(--accent-orange)', 'var(--accent-red)'];

  // Map confidence distribution to recharts pie format
  const pieData = analytics.confidence_distribution.map((item: { level: string; count: number }) => ({
    name: item.level === 'high' ? 'High · Auto Repair' : item.level === 'medium' ? 'Medium · Suggest Repair' : 'Low · Human Required',
    value: item.count,
  }));

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Analytics' }]} />

      {/* KPI Cards Row (6 columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <KpiCard
          label="TOTAL PROCESSED"
          value={analytics.total_processed}
          icon={<FileText size={18} color="var(--accent-blue)" />}
        />
        <KpiCard
          label="CERTIFIED TODAY"
          value={analytics.certified_today}
          icon={<CheckCircle size={18} color="var(--accent-green)" />}
          valueColor="var(--accent-green)"
        />
        <KpiCard
          label="AUTO-FIX RATE"
          value={formatPercentage(analytics.auto_fix_rate)}
          icon={<Zap size={18} color="var(--accent-purple)" />}
          valueColor="var(--accent-purple)"
        />
        <KpiCard
          label="AVG TIME SAVED"
          value={`${analytics.avg_time_saved_minutes} min`}
          icon={<Clock size={18} color="var(--accent-teal)" />}
          valueColor="var(--accent-teal)"
        />
        <KpiCard
          label="MANUAL REDUCTION"
          value={formatPercentage(analytics.manual_effort_reduced)}
          icon={<TrendingDown size={18} color="var(--accent-orange)" />}
          valueColor="var(--accent-orange)"
        />
        <KpiCard
          label="KG ENTRIES"
          value={analytics.knowledge_graph_entries}
          icon={<Database size={18} color="var(--accent-gold)" />}
          valueColor="var(--accent-gold)"
        />
      </div>

      {/* Row 1 Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        {/* Compliance trend */}
        <div className="card" style={{ padding: '20px' }}>
          <span className="section-header" style={{ display: 'block', marginBottom: '16px' }}>Compliance Score Trend (7 days)</span>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={analytics.compliance_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
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
                />
                <CartesianGrid vertical={false} stroke="var(--border-light)" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="score" stroke="var(--accent-blue)" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry distribution (Horizontal Bar Chart) */}
        <div className="card" style={{ padding: '20px' }}>
          <span className="section-header" style={{ display: 'block', marginBottom: '16px' }}>Industry Distribution</span>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={analytics.industry_distribution}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis dataKey="industry" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        {/* Error source breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <span className="section-header" style={{ display: 'block', marginBottom: '16px' }}>Error Type Breakdown</span>
          <div style={{ width: '100%', height: 260 }}>
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
                />
                <CartesianGrid vertical={false} stroke="var(--border-light)" strokeDasharray="3 3" />
                <Bar dataKey="count" fill="var(--accent-orange)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Donut */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <span className="section-header" style={{ display: 'block', marginBottom: '16px' }}>Confidence Distribution</span>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_entry: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {pieData.map((item: { name: string; value: number }, idx: number) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: '2px' }} />
                {item.name} ({item.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom widgets: Top Violated Rules table & Frequently Auto Repaired Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        {/* Top Violated Rules */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span className="section-header">Top Violated Rules</span>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr className="table-header" style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Rule Code</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Count</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Auto-Fix Rate</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Rate Bar</th>
                </tr>
              </thead>
              <tbody>
                 {analytics.top_violated_rules.map((rule: { rule_code: string; count: number; auto_fix_rate: number }) => {
                  const rate = rule.auto_fix_rate;
                  const isHigh = rate >= 0.8;
                  const barColor = isHigh ? 'var(--accent-green)' : 'var(--accent-red)';

                  return (
                    <tr key={rule.rule_code} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, fontFamily: 'monospace' }}>
                        {rule.rule_code}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{rule.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: barColor }}>
                        {formatPercentage(rate)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ width: '120px', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${rate * 100}%`, height: '100%', background: barColor }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most frequently auto repaired bar chart */}
        <div className="card" style={{ padding: '20px' }}>
          <span className="section-header" style={{ display: 'block', marginBottom: '16px' }}>
            Most Frequently Auto-Repaired Rules
          </span>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={analytics.most_auto_repaired}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis dataKey="rule_code" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="var(--accent-green)" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
