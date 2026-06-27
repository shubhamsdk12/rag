import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        maxWidth: '480px',
        margin: '40px auto',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-red)',
        }}
      >
        <AlertTriangle size={28} />
      </div>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
          Connection Error
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          {message || 'Failed to connect to the backend system. Please verify the API status and try again.'}
        </p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary" style={{ gap: '8px', padding: '10px 20px' }}>
          <RefreshCw size={16} />
          Retry Request
        </button>
      )}
    </div>
  );
}
