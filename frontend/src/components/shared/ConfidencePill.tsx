interface ConfidencePillProps {
  confidence: 'high' | 'medium' | 'low' | string;
  score?: number;
}

export default function ConfidencePill({ confidence, score }: ConfidencePillProps) {
  let className = 'badge ';
  const confStr = confidence.toLowerCase();

  if (confStr === 'high') {
    className += 'confidence-high';
  } else if (confStr === 'medium') {
    className += 'confidence-medium';
  } else {
    className += 'confidence-low';
  }

  return (
    <span className={className} style={{ gap: '4px' }}>
      <span style={{ textTransform: 'capitalize' }}>{confidence}</span>
      {score !== undefined && (
        <span style={{ opacity: 0.8, fontSize: '10px', fontFamily: 'monospace' }}>
          {score.toFixed(2)}
        </span>
      )}
    </span>
  );
}
