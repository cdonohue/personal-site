import type { CSSProperties, ReactNode } from 'react';
import { useXRay } from './XRay';

type Padding = 'tight' | 'standard' | 'container';

type CardProps = {
  padding?: Padding;
  children: ReactNode;
  style?: CSSProperties;
};

export function Card({ padding = 'container', children, style }: CardProps) {
  const { enabled } = useXRay();

  return (
    <div
      className="lab-card"
      data-xray={enabled}
      style={{
        padding: `var(--space-${padding})`,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        ...style,
      }}
    >
      {enabled && <span className="xray-label">Card padding="{padding}"</span>}
      {children}
    </div>
  );
}
