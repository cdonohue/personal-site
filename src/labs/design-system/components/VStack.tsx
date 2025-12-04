import type { CSSProperties, ReactNode } from 'react';
import { useXRay } from './XRay';

type Gap = 'micro' | 'tight' | 'standard' | 'container' | 'layout' | 'section';

type VStackProps = {
  gap?: Gap;
  children: ReactNode;
  style?: CSSProperties;
};

export function VStack({ gap = 'standard', children, style }: VStackProps) {
  const { enabled } = useXRay();

  return (
    <div
      className="lab-vstack"
      data-xray={enabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `var(--space-${gap})`,
        ...style,
      }}
    >
      {enabled && <span className="xray-label">VStack gap="{gap}"</span>}
      {children}
    </div>
  );
}
