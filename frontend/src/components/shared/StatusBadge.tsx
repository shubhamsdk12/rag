
export type BadgeVariant =
  | 'certified'
  | 'pending_review'
  | 'auto_fixed'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'high'
  | 'medium'
  | 'low'
  | 'error'
  | 'warning'
  | 'info';

interface StatusBadgeProps {
  variant: BadgeVariant | string;
  label?: string;
}

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  let className = 'badge ';
  let text = label || variant;

  switch (variant.toLowerCase()) {
    case 'certified':
    case 'certified_ready_for_transmission':
      className += 'badge-certified';
      text = label || 'Certified';
      break;
    case 'pending review':
    case 'pending_review':
    case 'needs review':
    case 'needs_review':
      className += 'badge-pending';
      text = label || 'Needs Review';
      break;
    case 'auto_applied':
    case 'auto_fixed':
    case 'auto fixed':
      className += 'badge-certified'; // uses the green color theme
      text = label || 'Auto Fixed';
      break;
    case 'approved':
      className += 'badge-success';
      text = label || 'Approved';
      break;
    case 'rejected':
      className += 'badge-error';
      text = label || 'Rejected';
      break;
    case 'high':
      className += 'confidence-high';
      text = label || 'High';
      break;
    case 'medium':
      className += 'confidence-medium';
      text = label || 'Medium';
      break;
    case 'low':
      className += 'confidence-low';
      text = label || 'Low';
      break;
    case 'error':
    case 'critical':
      className += 'badge-error';
      text = label || 'Error';
      break;
    case 'warning':
      className += 'badge-warning';
      text = label || 'Warning';
      break;
    case 'info':
    default:
      className += 'badge-info';
      text = label || 'Info';
      break;
  }

  return <span className={className}>{text}</span>;
}
