import { Check, X } from 'lucide-react';

interface ProposedFixProps {
  original: string;
  proposed: string;
  status: 'auto_applied' | 'pending_review' | 'approved' | 'rejected';
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  rejectReason: string;
  setRejectReason: (val: string) => void;
  isRejecting: boolean;
  setIsRejecting: (val: boolean) => void;
  disabled?: boolean;
}

export default function ProposedFix({
  original,
  proposed,
  status,
  onApprove,
  onReject,
  rejectReason,
  setRejectReason,
  isRejecting,
  setIsRejecting,
  disabled = false,
}: ProposedFixProps) {
  const isPending = status === 'pending_review';

  return (
    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <span className="section-header" style={{ fontSize: '12px' }}>
        Proposed Fix
      </span>

      {/* Before / After grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Before */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>BEFORE</span>
          <div
            className="diff-original font-mono"
            style={{
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {original}
          </div>
        </div>

        {/* After */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>AFTER</span>
          <div
            className="diff-proposed font-mono"
            style={{
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {proposed}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {isRejecting && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Rejection Reason (Required)
              </label>
              <input
                type="text"
                placeholder="Specify why you are rejecting this suggested fix..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100%',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {isRejecting && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setIsRejecting(false);
                  setRejectReason('');
                }}
                disabled={disabled}
              >
                Cancel
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={onReject}
              disabled={disabled || (isRejecting && !rejectReason.trim())}
              style={{ gap: '6px' }}
            >
              <X size={16} />
              Reject Suggestion
            </button>
            {!isRejecting && (
              <button
                className="btn btn-success"
                onClick={onApprove}
                disabled={disabled}
                style={{ gap: '6px' }}
              >
                <Check size={16} />
                Approve Suggested Fix
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
