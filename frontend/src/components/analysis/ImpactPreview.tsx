import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ImpactPreviewProps {
  preview: {
    affected_fields: string[];
    rules_at_risk: string[];
    compliance_impact: string;
    operational_impact: string;
  };
}

export default function ImpactPreview({ preview }: ImpactPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⚡ IMPACT PREVIEW
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '13px',
          }}
        >
          {/* Affected Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Affected Fields
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {preview.affected_fields.map((f, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: 'monospace',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: '1px solid var(--border)',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Rules at Risk */}
          {preview.rules_at_risk.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Rules at Risk
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                {preview.rules_at_risk.map((rule, idx) => (
                  <li key={idx} style={{ color: 'var(--accent-red)' }}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Compliance Impact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Compliance Impact
            </span>
            <p style={{ margin: 0, color: 'var(--accent-green)', fontWeight: 500 }}>
              {preview.compliance_impact}
            </p>
          </div>

          {/* Operational Impact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Operational Impact
            </span>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              {preview.operational_impact}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
