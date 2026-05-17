/**
 * Browser-safe `makeCssVar(path, prefix)` helper. Exported through the
 * `@unpunnyfuns/swatchbook-core/css-var` subpath so the addon's hooks
 * and the blocks-side display surface share one implementation — any
 * future naming-policy shift in Terrazzo (casing, unicode, prefix
 * handling) reaches both at once instead of needing parallel updates.
 *
 * Wraps `@terrazzo/token-tools/css`'s `makeCSSVar` because its `prefix`
 * option is a function-argument-position concern (per call) while
 * `wrapVar: true` is a here-always concern (every caller wants the
 * `var(--…)` wrapper). The two-argument shape `(path, prefix)` is the
 * ergonomic minimum.
 */
import { makeCSSVar } from '@terrazzo/token-tools/css';

export function makeCssVar(path: string, prefix: string): string {
  return prefix ? makeCSSVar(path, { prefix, wrapVar: true }) : makeCSSVar(path, { wrapVar: true });
}
