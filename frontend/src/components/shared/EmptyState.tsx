import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        maxWidth: '480px',
        margin: '40px auto',
        gap: '16px',
        borderStyle: 'dashed',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <FileQuestion size={28} />
      </div>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
          {title || 'No Records Found'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          {description || 'There are no items to display in this list. Upload or create a new instance to begin.'}
        </p>
      </div>
    </div>
  );
}
