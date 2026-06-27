interface FormatBadgeProps {
  format: 'EDI X12' | 'XML' | 'JSON' | 'CSV' | string;
}

export default function FormatBadge({ format }: FormatBadgeProps) {
  let className = 'badge ';
  const normalized = format.toUpperCase();

  if (normalized.includes('EDI') || normalized.includes('X12')) {
    className += 'badge-edi';
  } else if (normalized.includes('XML')) {
    className += 'badge-xml';
  } else if (normalized.includes('JSON')) {
    className += 'badge-json';
  } else {
    className += 'badge-csv';
  }

  return <span className={className}>{format}</span>;
}
