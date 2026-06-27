import type { CSSProperties } from 'react';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
}

export default function SkeletonLoader({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  style,
}: SkeletonLoaderProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SkeletonLoader width="40%" height="16px" />
      <SkeletonLoader width="80%" height="24px" />
      <SkeletonLoader width="60%" height="14px" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <SkeletonLoader width="15%" height="20px" />
        <SkeletonLoader width="25%" height="20px" />
        <SkeletonLoader width="20%" height="20px" />
        <SkeletonLoader width="20%" height="20px" />
        <SkeletonLoader width="20%" height="20px" />
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '16px' }}>
          <SkeletonLoader width="15%" height="16px" />
          <SkeletonLoader width="25%" height="16px" />
          <SkeletonLoader width="20%" height="16px" />
          <SkeletonLoader width="20%" height="16px" />
          <SkeletonLoader width="20%" height="16px" />
        </div>
      ))}
    </div>
  );
}
