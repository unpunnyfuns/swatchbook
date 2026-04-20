import type { CSSProperties, ReactElement, ReactNode } from 'react';

/**
 * Chrome-style primitives shared across every block. Kept as JS exports
 * for the inline-style sites that still compose them into per-block style
 * objects (e.g. TokenNavigator's `typePill` that builds on the shared
 * pill base). The pure direct-reference chrome — surface wrapper, caption,
 * empty-state — lives in `styles.css` and is applied via class names.
 */

export const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const TEXT_DEFAULT = 'var(--sb-color-sys-text-default, CanvasText)';
export const TEXT_MUTED = 'var(--sb-color-sys-text-muted, CanvasText)';

export const SURFACE_DEFAULT = 'var(--sb-color-sys-surface-default, Canvas)';
export const SURFACE_RAISED = 'var(--sb-color-sys-surface-raised, Canvas)';
export const SURFACE_MUTED = 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.15))';

export const BORDER_DEFAULT = `1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))`;
export const BORDER_FAINT = `1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))`;
export const BORDER_STRONG = `1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.3))`;

export const SIZE_LABEL = 11;
export const SIZE_META = 12;
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
 * it in their own block wrapper (which already carries `themeAttrs` +
 * `chromeAliases`), so the message itself just needs the muted type.
 */
export function EmptyState({ children }: { children: ReactNode }): ReactElement {
  return <div className='sb-block__empty'>{children}</div>;
}
