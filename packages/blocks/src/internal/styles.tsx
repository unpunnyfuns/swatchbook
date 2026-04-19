import type { CSSProperties, ReactElement, ReactNode } from 'react';

/**
 * Chrome-style primitives shared across every block. The `var(--sb-*)`
 * references resolve to the active `cssVarPrefix` via the wrapper's
 * `chromeAliases()` spread, so blocks stay theme-aware without each one
 * reimplementing the fallback chain.
 *
 * Add a new constant here when a second block needs it — not when the
 * first one does. Keep ad-hoc inline values out of blocks so restyling
 * the chrome is a one-file change.
 */

export const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// Text colors — every block uses these; keep the CSS-var fallbacks
// identical across blocks so system-fallback rendering is consistent.
export const TEXT_DEFAULT = 'var(--sb-color-sys-text-default, CanvasText)';
export const TEXT_MUTED = 'var(--sb-color-sys-text-muted, CanvasText)';

// Surface colors for nested chrome (swatch backs, pill bg, overlay
// surfaces). Block wrappers use `surfaceStyle`'s `background` directly.
export const SURFACE_DEFAULT = 'var(--sb-color-sys-surface-default, Canvas)';
export const SURFACE_RAISED = 'var(--sb-color-sys-surface-raised, Canvas)';
export const SURFACE_MUTED = 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.15))';

// Border primitives. DEFAULT is the normal row divider; FAINT is the
// inside-cell separator inside a larger grouped block (TokenTable's
// rows). Fallback alphas differ so the hierarchy reads even without
// any tokens loaded.
export const BORDER_DEFAULT = `1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))`;
export const BORDER_FAINT = `1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))`;
export const BORDER_STRONG = `1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.3))`;

// Typography sizes used across the chrome. Body text is the inherited
// size from `surfaceStyle`; `SIZE_LABEL` / `SIZE_META` keep the smaller
// secondary text identical across blocks.
export const SIZE_LABEL = 11;
export const SIZE_META = 12;
export const SIZE_PILL = 10;

export const surfaceStyle = {
  fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
  fontSize: 'var(--sb-typography-sys-body-font-size, 14px)',
  color: TEXT_DEFAULT,
  background: SURFACE_DEFAULT,
  padding: 12,
  borderRadius: 6,
} satisfies CSSProperties;

export const captionStyle = {
  padding: '4px 0 12px',
  color: TEXT_MUTED,
  fontSize: SIZE_META,
} satisfies CSSProperties;

export const sectionHeaderStyle = {
  fontSize: SIZE_LABEL,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: TEXT_MUTED,
  marginBottom: 8,
} satisfies CSSProperties;

export const metaStyle = {
  fontFamily: MONO_STACK,
  fontSize: SIZE_LABEL,
  color: TEXT_MUTED,
} satisfies CSSProperties;

export const typePillStyle = {
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: SIZE_PILL,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  background: SURFACE_MUTED,
} satisfies CSSProperties;

export const emptyStyle = {
  padding: '24px 12px',
  textAlign: 'center',
  color: TEXT_MUTED,
} satisfies CSSProperties;

/**
 * Inner content for a block's "nothing to render" state. Call sites wrap
 * it in their own block wrapper (which already carries `themeAttrs` +
 * `chromeAliases`), so the message itself just needs the muted type.
 */
export function EmptyState({ children }: { children: ReactNode }): ReactElement {
  return <div style={emptyStyle}>{children}</div>;
}
