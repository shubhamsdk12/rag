interface GraphRagContextProps {
  context: {
    retrieved_rules: string[];
    related_entities: string[];
    historical_pattern?: string;
  };
}

export default function GraphRagContext({ context }: GraphRagContextProps) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'rgba(124, 58, 237, 0.04)',
        border: '1px solid rgba(124, 58, 237, 0.15)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <span
        className="section-header"
        style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 700 }}
      >
        ⟳ GRAPHRAG CONTEXT
      </span>

      {/* Retrieved Rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Retrieved Rules
        </span>
        <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          {context.retrieved_rules.map((rule, idx) => (
            <li key={idx} style={{ marginBottom: '2px' }}>{rule}</li>
          ))}
        </ul>
      </div>

      {/* Related Entities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Related Entities
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {context.related_entities.map((entity, idx) => (
            <span
              key={idx}
              className="badge"
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                color: 'var(--accent-purple)',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(124, 58, 237, 0.15)',
              }}
            >
              {entity}
            </span>
          ))}
        </div>
      </div>

      {/* Historical Pattern */}
      {context.historical_pattern && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(124, 58, 237, 0.15)', paddingTop: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Historical Pattern
          </span>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>
            {context.historical_pattern}
          </p>
        </div>
      )}
    </div>
  );
}
