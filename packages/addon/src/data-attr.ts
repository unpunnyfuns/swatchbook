/**
 * Produce a prefixed `data-*` attribute name when `prefix` is set, bare
 * `data-<key>` otherwise. Duplicated from `@unpunnyfuns/swatchbook-core`'s
 * `dataAttr` so the preview bundle doesn't have to import from core —
 * core's top-level entry pulls in Node-only modules (`node:fs/promises`
 * via the loader) that throw when evaluated in the browser.
 */
export function dataAttr(prefix: string, key: string): string {
  return prefix ? `data-${prefix}-${key}` : `data-${key}`;
}
