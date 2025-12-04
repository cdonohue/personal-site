import type { CSSProperties, ReactNode } from 'react';
import { useXRay } from './XRay';

type Gap = 'micro' | 'tight' | 'standard' | 'container' | 'layout' | 'section';
type Align = 'start' | 'center' | 'end' | 'stretch';

type HStackProps = {
  gap?: Gap;
  align?: Align;
  children: ReactNode;
  style?: CSSProperties;
};

export function HStack({ gap = 'standard', align = 'stretch', children, style }: HStackProps) {
  const { enabled } = useXRay();

  return (
    <div
      className="lab-hstack"
      data-xray={enabled}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: align,
        gap: `var(--space-${gap})`,
        ...style,
      }}
    >
      {enabled && <span className="xray-label">HStack gap="{gap}"</span>}
      {children}
    </div>
  );
}
