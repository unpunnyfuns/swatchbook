/**
 * Escape backslash + double-quote in a CSS string literal — used for
 * `data-*` attribute selector values and other places where token /
 * context names may contain characters that need quoting.
 */
export function cssEscape(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
