import { AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import type { AnalysisError } from '../../types';
import StatusBadge from '../shared/StatusBadge';
import ConfidencePill from '../shared/ConfidencePill';

interface ErrorListProps {
  errors: AnalysisError[];
  selectedErrorId: string | null;
  onSelectError: (id: string) => void;
  activeFilter: 'all' | 'error' | 'warning' | 'risky';
  setActiveFilter: (filter: 'all' | 'error' | 'warning' | 'risky') => void;
  activeSourceFilter: 'all' | 'parser' | 'snip' | 'graph' | 'semantic';
  setActiveSourceFilter: (source: 'all' | 'parser' | 'snip' | 'graph' | 'semantic') => void;
}

export default function ErrorList({
  errors,
  selectedErrorId,
  onSelectError,
  activeFilter,
  setActiveFilter,
  activeSourceFilter,
  setActiveSourceFilter,
}: ErrorListProps) {
  // Count filters
  const counts = {
    all: errors.length,
    errors: errors.filter((e) => e.severity === 'error').length,
    warnings: errors.filter((e) => e.severity === 'warning').length,
    risky: errors.filter((e) => e.triage_category === 'risky_fix').length,
  };

  const filteredErrors = errors.filter((err) => {
    // Severity filters
    if (activeFilter === 'error' && err.severity !== 'error') return false;
    if (activeFilter === 'warning' && err.severity !== 'warning') return false;
    if (activeFilter === 'risky' && err.triage_category !== 'risky_fix') return false;

    // Source filters
    if (activeSourceFilter !== 'all' && err.source !== activeSourceFilter) return false;

    return true;
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Category Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <TabButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} label="All" count={counts.all} />
        <TabButton active={activeFilter === 'error'} onClick={() => setActiveFilter('error')} label="Errors" count={counts.errors} />
        <TabButton active={activeFilter === 'warning'} onClick={() => setActiveFilter('warning')} label="Warnings" count={counts.warnings} />
        <TabButton active={activeFilter === 'risky'} onClick={() => setActiveFilter('risky')} label="Risky" count={counts.risky} />
      </div>

      {/* Source pills */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
        <SourcePill active={activeSourceFilter === 'all'} onClick={() => setActiveSourceFilter('all')} label="All Sources" />
        <SourcePill active={activeSourceFilter === 'parser'} onClick={() => setActiveSourceFilter('parser')} label="Parser" />
        <SourcePill active={activeSourceFilter === 'snip'} onClick={() => setActiveSourceFilter('snip')} label="SNIP Validator" />
        <SourcePill active={activeSourceFilter === 'graph'} onClick={() => setActiveSourceFilter('graph')} label="Graph" />
        <SourcePill active={activeSourceFilter === 'semantic'} onClick={() => setActiveSourceFilter('semantic')} label="Semantic" />
      </div>

      {/* Error items list */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '600px' }}>
        {filteredErrors.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No errors match the current filters.
          </div>
        ) : (
          filteredErrors.map((err) => {
            const isSelected = err.error_id === selectedErrorId;
            const isError = err.severity === 'error';
            const status = err.triage_status || 'pending_review';

            return (
              <div
                key={err.error_id}
                onClick={() => onSelectError(err.error_id)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(124, 58, 237, 0.04)' : 'transparent',
                  borderLeft: isSelected ? '4px solid var(--accent-purple)' : '4px solid transparent',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {isError ? (
                    <AlertCircle size={18} color="var(--accent-red)" />
                  ) : (
                    <AlertTriangle size={18} color="var(--accent-orange)" />
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>
                      {err.code}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <StatusBadge variant={status} />
                      <ConfidencePill confidence={err.explanation.confidence} />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {err.message}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" style={{ alignSelf: 'center' }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 8px',
        border: 'none',
        background: active ? 'var(--bg-primary)' : 'transparent',
        borderBottom: active ? '2px solid var(--accent-purple)' : '2px solid transparent',
        color: active ? 'var(--accent-purple)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 500,
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
    >
      {label}
      <span
        style={{
          background: active ? 'rgba(124, 58, 237, 0.1)' : 'var(--border)',
          color: active ? 'var(--accent-purple)' : 'var(--text-secondary)',
          padding: '1px 6px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function SourcePill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        border: active ? '1px solid var(--accent-purple)' : '1px solid var(--border)',
        background: active ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-primary)',
        color: active ? 'var(--accent-purple)' : 'var(--text-secondary)',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}
