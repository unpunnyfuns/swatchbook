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
import type { Project } from '#/types.ts';

export function makeCssVar(path: string, prefix: string): string {
  return prefix ? makeCSSVar(path, { prefix, wrapVar: true }) : makeCSSVar(path, { wrapVar: true });
}

/**
 * Authoritative custom-property name (bare `--…`, no `var()` wrapper) for a
 * token path. Listing-first: a resolver-backed project's listing carries the
 * exact names plugin-css emitted, so reading it can never drift from the
 * consumer's real output. Falls back to Terrazzo's own derivation for
 * listing-less projects — never a hand-rolled dot-to-dash, which diverges on
 * camelCase segments (`color.brandPrimary` is `--color-brand-primary` in
 * plugin-css output, not `--color-brandPrimary`).
 */
export function cssVarName(path: string, project: Pick<Project, 'listing' | 'config'>): string {
  const listed = project.listing[path]?.$extensions['app.terrazzo.listing'].names['css'];
  if (listed) return listed;
  const prefix = project.config.cssVarPrefix;
  return prefix ? makeCSSVar(path, { prefix }) : makeCSSVar(path);
}
