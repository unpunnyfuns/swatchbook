import type { CSSProperties, ReactElement, ReactNode } from 'react';

/**
 * Chrome-style primitives shared across every block. Kept as JS exports
 * for the inline-style sites that still compose them into per-block style
 * objects (e.g. TokenNavigator's `typePill` that builds on the shared
 * pill base). The pure direct-reference chrome — surface wrapper, caption,
 * empty-state — lives in `styles.css` and is applied via class names.
 */

export const TEXT_DEFAULT = 'var(--swatchbook-text-default, CanvasText)';
export const TEXT_MUTED = 'var(--swatchbook-text-muted, CanvasText)';

export const SURFACE_DEFAULT = 'var(--swatchbook-surface-default, Canvas)';
export const SURFACE_RAISED = 'var(--swatchbook-surface-raised, Canvas)';
export const SURFACE_MUTED = 'var(--swatchbook-surface-muted, rgba(128,128,128,0.15))';

export const BORDER_DEFAULT = `1px solid var(--swatchbook-border-default, rgba(128,128,128,0.2))`;
export const BORDER_FAINT = `1px solid var(--swatchbook-border-default, rgba(128,128,128,0.15))`;
export const BORDER_STRONG = `1px solid var(--swatchbook-border-default, rgba(128,128,128,0.3))`;

export const SIZE_PILL = 10;

export const typePillStyle = {
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: SIZE_PILL,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  background: SURFACE_MUTED,
} satisfies CSSProperties;

/**
 * Inner content for a block's "nothing to render" state. Call sites wrap
 * it in their own block wrapper (which already carries `themeAttrs`), so
 * the message itself just needs the muted type.
 */
export function EmptyState({ children }: { children: ReactNode }): ReactElement {
  return <div className="sb-block__empty">{children}</div>;
}
