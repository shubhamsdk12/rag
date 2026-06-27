import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GitBranch, Info } from 'lucide-react';
import type { GraphData, GraphNode } from '../types';
import { getGraphData } from '../api/analysis';
import TopBar from '../components/layout/TopBar';
import RelationshipGraph from '../components/graph/RelationshipGraph';
import ErrorState from '../components/shared/ErrorState';
import { SkeletonCard } from '../components/shared/SkeletonLoader';

export default function GraphExplorer() {
  const { documentId } = useParams<{ documentId: string }>();

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const fetchGraph = async () => {
    if (!documentId) {
      setError('No document ID specified.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getGraphData(documentId);
      setGraphData(data);
      if (data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch transaction relationship graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [documentId]);

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Graph Explorer' }]} showStatus={false} />
        <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '20px' }}>
          <div style={{ height: '500px' }}><SkeletonCard /></div>
          <div style={{ height: '500px' }}><SkeletonCard /></div>
        </div>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="page-content">
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Graph Explorer' }]} showStatus={false} />
        <ErrorState message={error || 'No graph data found.'} onRetry={fetchGraph} />
      </div>
    );
  }

  // Node color legends map
  const typeColors: Record<string, string> = {
    Patient: '#E5D3B3',
    Provider: '#10B981',
    Claim: '#F59E0B',
    Service: '#14B8A6',
    Payment: '#EF4444',
  };

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top bar with back link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to={`/analysis/${documentId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Back to Analysis
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch size={18} color="var(--accent-purple)" />
            Cross-Document Relationship Graph
          </h2>
        </div>
      </div>

      {/* Cross-document links banner */}
      {graphData.cross_document_links > 0 && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderLeft: '4px solid var(--accent-purple)',
            background: 'rgba(124, 58, 237, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          <Info size={16} color="var(--accent-purple)" />
          <span>
            Cross-document links found:{' '}
            <strong style={{ color: 'var(--accent-purple)' }}>{graphData.cross_document_links}</strong>. Matches
            reconciled on historical payment indicators.
          </span>
        </div>
      )}

      {/* Two-Panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '20px', alignItems: 'stretch' }}>
        {/* Left: Graph canvas container */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '550px' }}>
          {/* Node legends */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColors.Patient }} /> Patient
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColors.Provider }} /> Provider
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColors.Claim }} /> Claim
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColors.Service }} /> Service
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColors.Payment }} /> Payment
            </span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>—— Normal</span>
            <span>- - - Flagged</span>
            <span>···· Cross-doc</span>
          </div>

          {/* D3 Render */}
          <div style={{ flex: 1, position: 'relative' }}>
            <RelationshipGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode ? selectedNode.id : null}
            />
          </div>
        </div>

        {/* Right: Properties Detail Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header properties */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: typeColors[selectedNode.type] || '#9CA3AF',
                  }}
                />
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedNode.type}
                </span>
              </div>

              {/* Title / Label */}
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {selectedNode.label}
              </h3>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

              {/* Properties values list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="section-header" style={{ fontSize: '11px' }}>PROPERTIES</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  {Object.entries(selectedNode.properties).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              Select any node in the graph workspace to view metadata attributes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
