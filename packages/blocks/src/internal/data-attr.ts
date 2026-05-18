import { dataAttr } from '@unpunnyfuns/swatchbook-core/data-attr';

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
const WRAPPER_CLASSES = 'sb-unstyled sb-block';

/**
 * Spread helper for the common block wrapper. Returns:
 * - One `data-<prefix>-<axisName>="<contextName>"` per axis in the tuple.
 *   These are what the smart CSS emitter actually targets — single-axis
 *   cell selectors (`[data-<prefix>-mode="Dark"]`) and joint compounds
 *   (`[data-<prefix>-mode="Dark"][data-<prefix>-brand="Brand A"]`).
 *   Wrapping a block subtree in these attrs lets the cascade resolve
 *   per-tuple values inside the block independently of the document
 *   root — `AxisVariance`'s grid uses this to render real per-cell
 *   swatches.
 * - `data-swatchbook-block` — stable consumer hook for targeting block
 *   chrome from outside.
 * - `className="sb-unstyled sb-block"` — Storybook's opt-out class so
 *   MDX docs house styles self-exclude the subtree, plus `sb-block`
 *   which carries the shared chrome from `internal/styles.css`.
 */
export function themeAttrs(
  prefix: string,
  tuple: Readonly<Record<string, string>>,
): Record<string, string> {
  return {
    ...perAxisAttrs(prefix, tuple),
    [BLOCK_ATTR]: '',
    className: WRAPPER_CLASSES,
  };
}

/**
 * Spread helper for any element that wants per-axis cell semantics
 * without the block-wrapper chrome — `AxisVariance`'s grid uses this
 * on each swatch so the swatch's CSS vars resolve at the cell's own
 * tuple, not the document root's active tuple.
 */
export function perAxisAttrs(
  prefix: string,
  tuple: Readonly<Record<string, string>>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [axisName, contextName] of Object.entries(tuple)) {
    out[dataAttr(prefix, axisName)] = contextName;
  }
  return out;
}
