import type { CSSProperties, ReactNode } from 'react';
import { useXRay } from './XRay';

type Size = 'sm' | 'base' | 'lg';
type Weight = 'normal' | 'medium' | 'bold';

type TextProps = {
  size?: Size;
  weight?: Weight;
  muted?: boolean;
  children: ReactNode;
  style?: CSSProperties;
};

export function Text({ size = 'base', weight = 'normal', muted = false, children, style }: TextProps) {
  const { enabled } = useXRay();

  const fontWeightMap = {
    normal: 400,
    medium: 500,
    bold: 700,
  };

  return (
    <span
      className="lab-text"
      data-xray={enabled}
      style={{
        fontSize: `var(--text-${size})`,
        fontWeight: fontWeightMap[weight],
        color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
        ...style,
      }}
    >
      {enabled && <span className="xray-label">Text size="{size}"</span>}
      {children}
    </span>
  );
}
