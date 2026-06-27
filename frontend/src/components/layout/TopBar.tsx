import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAppState } from '../../context/AppContext';

interface TopBarProps {
  breadcrumbs: { label: string; to?: string }[];
  showStatus?: boolean;
}

export default function TopBar({ breadcrumbs, showStatus = true }: TopBarProps) {
  const { healthStatus } = useAppState();

  const neo4j = healthStatus?.neo4j_connected ?? false;
  const chromadb = healthStatus?.chromadb_ready ?? false;
  const graphrag = neo4j && chromadb;
  const llm = healthStatus !== null;

  return (
    <div className="topbar">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ color: 'var(--text-muted)' }}>/</span>}
            {crumb.to ? (
              <Link to={crumb.to} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                {crumb.label}
              </Link>
            ) : (
              <span className="current">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Status Dots */}
        {showStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            <StatusDot label="Neo4j" connected={neo4j} />
            <StatusDot label="ChromaDB" connected={chromadb} />
            <StatusDot label="GraphRAG" connected={graphrag} />
            <StatusDot label="LLM" connected={llm} />
          </div>
        )}

        {/* New Analysis Button */}
        <Link to="/ingest" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ gap: 6 }}>
            <Plus size={16} />
            New Analysis
          </button>
        </Link>
      </div>
    </div>
  );
}

function StatusDot({ label, connected }: { label: string; connected: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
      {label}
    </span>
  );
}
