import type { CSSProperties } from 'react';

/**
 * Produce a prefixed `data-*` attribute name when `prefix` is set, bare
 * `data-<key>` otherwise. Mirrors `dataAttr` in `@unpunnyfuns/swatchbook-core`
 * so block wrappers and emitted-CSS selectors stay in lockstep without
 * blocks taking a runtime dep on core.
 */
export function dataAttr(prefix: string, key: string): string {
  return prefix ? `data-${prefix}-${key}` : `data-${key}`;
}

/**
 * Marker attribute set on every block wrapper. Retained as a stable hook
 * for consumer-side selectors (e.g. when a host app wants to target or
 * override block chrome without relying on hashed class names).
 */
export const BLOCK_ATTR = 'data-swatchbook-block';

/**
 * Opt-out class that Storybook's `.sbdocs` stylesheet uses to self-exclude
 * on MDX docs pages — every `.sbdocs` house rule is wrapped in
 * `:not(.sb-unstyled, .sb-unstyled *)`, so any descendant of a `.sb-unstyled`
 * container is left alone. Stamped onto every block wrapper so blocks
 * render identically in MDX docs and regular stories without fighting
 * cascade specificity.
 */
const STORYBOOK_UNSTYLED_CLASS = 'sb-unstyled';

/**
 * Spread helper for the common `<div data-<prefix>-theme="…" data-swatchbook-block className="sb-unstyled">`
 * block wrapper. Returns the prefixed theme attribute, the scoping marker,
 * and Storybook's `.sb-unstyled` opt-out class.
 */
export function themeAttrs(prefix: string, themeName: string): Record<string, string> {
  return {
    [dataAttr(prefix, 'theme')]: themeName,
    [BLOCK_ATTR]: '',
    className: STORYBOOK_UNSTYLED_CLASS,
  };
}

/**
 * Vars block chrome reads by literal `var(--sb-*)` regardless of what the
 * project's actual `cssVarPrefix` is. Keeping the literal spelling means we
 * only need to alias these few names on each block wrapper; the bulk of
 * block styling stays untouched.
 */
const CHROME_VARS = [
  'color-sys-border-default',
  'color-sys-surface-default',
  'color-sys-surface-muted',
  'color-sys-surface-raised',
  'color-sys-text-default',
  'color-sys-text-muted',
  'color-sys-accent-bg',
  'color-sys-accent-fg',
  'typography-sys-body-font-family',
  'typography-sys-body-font-size',
] as const;

/**
 * CSS custom-property aliases that redirect the block chrome's `var(--sb-*)`
 * reads to the project's actual `cssVarPrefix`. Block components spread the
 * return into their wrapper's inline `style`, so the aliases cascade down
 * into every nested block / sample / token-detail piece without each one
 * re-reading the prefix.
 *
 * When `prefix === 'sb'` the aliases are self-references — we skip emission
 * to keep the inline style shorter. When `prefix === ''` (opt-out) the
 * aliases point at the bare `var(--color-sys-…)` names core emitted.
 */
export function chromeAliases(prefix: string): CSSProperties {
  if (prefix === 'sb') return {};
  const out: Record<string, string> = {};
  const head = prefix ? `${prefix}-` : '';
  for (const name of CHROME_VARS) {
    out[`--sb-${name}`] = `var(--${head}${name})`;
  }
  return out as CSSProperties;
}
