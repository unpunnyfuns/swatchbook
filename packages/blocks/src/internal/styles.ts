import type { CSSProperties } from 'react';

export const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const BORDER_DEFAULT = '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))';

export const BORDER_FAINT = '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))';

export const surfaceStyle = {
  fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
  fontSize: 'var(--sb-typography-sys-body-font-size, 14px)',
  color: 'var(--sb-color-sys-text-default, CanvasText)',
  background: 'var(--sb-color-sys-surface-default, Canvas)',
  padding: 12,
  borderRadius: 6,
} satisfies CSSProperties;

export const captionStyle = {
  padding: '4px 0 12px',
  opacity: 0.7,
  fontSize: 12,
} satisfies CSSProperties;

export const emptyStyle = {
  padding: '24px 12px',
  textAlign: 'center',
  opacity: 0.6,
} satisfies CSSProperties;
