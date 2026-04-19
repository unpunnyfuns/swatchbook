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
 * Spread helper for the common `<div data-<prefix>-theme="…">` block
 * wrapper. Returns an object keyed on the prefixed attribute name so the
 * call site stays readable: `<div {...themeAttrs(prefix, theme)} />`.
 */
export function themeAttrs(prefix: string, themeName: string): Record<string, string> {
  return { [dataAttr(prefix, 'theme')]: themeName };
}
