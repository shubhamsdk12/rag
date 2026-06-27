import { type ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  valueColor?: string; // defaults to --text-primary
}

export default function KpiCard({ label, value, subtext, icon, valueColor }: KpiCardProps) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="section-header" style={{ fontSize: '11px' }}>{label}</span>
        <span style={{ fontSize: '28px', fontWeight: 700, color: valueColor || 'var(--text-primary)', lineHeight: 1.2 }}>
          {value}
        </span>
        {subtext && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtext}</span>}
      </div>
      <div style={{ color: 'var(--text-muted)' }}>
        {icon}
      </div>
    </div>
  );
}
