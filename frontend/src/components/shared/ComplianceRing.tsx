interface ComplianceRingProps {
  score: number;
  size?: number; // width/height in px
  strokeWidth?: number;
}

export default function ComplianceRing({ score, size = 80, strokeWidth = 8 }: ComplianceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  let color = 'var(--accent-red)';
  if (score >= 90) {
    color = 'var(--accent-green)';
  } else if (score >= 70) {
    color = 'var(--accent-orange)';
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--border-light)"
          strokeWidth={strokeWidth}
        />
        {/* Colored progress bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.35s' }}
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: size * 0.22, fontWeight: 700, color: 'var(--text-primary)' }}>
        {Math.round(score)}%
      </div>
    </div>
  );
}
