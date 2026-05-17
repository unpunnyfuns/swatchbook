/**
 * Browser-safe `data-*` attribute-name helper. Exported through the
 * `@unpunnyfuns/swatchbook-core/data-attr` subpath so the addon's
 * preview decorator, the blocks-side wrappers, and the core CSS emitter
 * share one implementation — every consumer producing or matching
 * `data-<prefix>-<key>` attributes stays in lockstep without any
 * package taking a transitive Terrazzo / Node dep.
 *
 * Empty `prefix` opts out of namespacing, producing bare `data-<key>`.
 */
export function dataAttr(prefix: string, key: string): string {
  return prefix ? `data-${prefix}-${key}` : `data-${key}`;
}
