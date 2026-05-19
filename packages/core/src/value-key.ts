/**
 * Stable comparison key for a DTCG token's `$value`. Composite tokens
 * (shadow, typography, …) compare on every sub-field; missing tokens
 * compare equal to the empty string.
 *
 * Object keys are sorted recursively so that two structurally equal
 * composite values compare as equal regardless of field insertion order
 * (e.g. when a walker reconstitutes a partial-alias composite, its
 * aliased sub-fields are appended last rather than placed in the
 * original schema order).
 *
 * Structural input type (`{$value?: unknown} | undefined`) so this
 * helper doesn't pull `@terrazzo/parser`'s `TokenNormalized` into the
 * import graph — keeps any consumer that wants only `valueKey`
 * Terrazzo-free.
 */
export function valueKey(token: { $value?: unknown } | undefined): string {
  if (!token) return '';
  return JSON.stringify(token.$value, sortedKeyReplacer);
}

function sortedKeyReplacer(this: unknown, _key: string, value: unknown): unknown {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(value as object).toSorted()) {
      sorted[k] = (value as Record<string, unknown>)[k];
    }
    return sorted;
  }
  return value;
}
