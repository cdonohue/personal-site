import type { CSSProperties, ReactNode } from 'react';
import { useXRay } from './XRay';

type Variant = 'primary' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
};

export function Button({ variant = 'primary', size = 'md', children, style, onClick }: ButtonProps) {
  const { enabled } = useXRay();

  const sizeStyles = {
    sm: { padding: 'var(--space-micro) var(--space-tight)', fontSize: 'var(--text-sm)' },
    md: { padding: 'var(--space-tight) var(--space-standard)', fontSize: 'var(--text-base)' },
    lg: { padding: 'var(--space-standard) var(--space-container)', fontSize: 'var(--text-lg)' },
  };

  const variantStyles = {
    primary: {
      background: 'var(--interactive)',
      color: 'var(--interactive-text)',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
  };

  return (
    <button
      type="button"
      className="lab-button"
      data-xray={enabled}
      onClick={onClick}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontWeight: 500,
        ...style,
      }}
    >
      {enabled && <span className="xray-label">Button {variant}/{size}</span>}
      {children}
    </button>
  );
}
