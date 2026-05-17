/**
 * Stable comparison key for a DTCG token's `$value`. Composite tokens
 * (shadow, typography, …) compare on every sub-field; missing tokens
 * compare equal to the empty string.
 *
 * Structural input type (`{$value?: unknown} | undefined`) so this
 * helper doesn't pull `@terrazzo/parser`'s `TokenNormalized` into the
 * import graph — keeps any consumer that wants only `valueKey`
 * Terrazzo-free.
 */
export function valueKey(token: { $value?: unknown } | undefined): string {
  if (!token) return '';
  return JSON.stringify(token.$value);
}
