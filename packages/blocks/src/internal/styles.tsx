import type { ReactElement, ReactNode } from 'react';

/**
 * Chrome-style primitives shared across every block. Kept as JS exports
 * for the inline-style sites that still compose them into per-block style
 * objects (e.g. TokenNavigator's `typePill` that builds on the shared
 * pill base). The pure direct-reference chrome — surface wrapper, caption,
 * empty-state — lives in `styles.css` and is applied via class names.
 */

export const TEXT_MUTED = 'var(--swatchbook-text-muted, CanvasText)';

export const SURFACE_RAISED = 'var(--swatchbook-surface-raised, Canvas)';
export const SURFACE_MUTED = 'var(--swatchbook-surface-muted, rgba(128,128,128,0.15))';

export const BORDER_FAINT = `1px solid var(--swatchbook-border-default, rgba(128,128,128,0.15))`;
export const BORDER_STRONG = `1px solid var(--swatchbook-border-default, rgba(128,128,128,0.3))`;

/**
 * Inner content for a block's "nothing to render" state. Call sites wrap
 * it in their own block wrapper (which already carries `blockWrapperAttrs`), so
 * the message itself just needs the muted type.
 */
export function EmptyState({ children }: { children: ReactNode }): ReactElement {
  return <div className="sb-block__empty">{children}</div>;
}
