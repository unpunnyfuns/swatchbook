/**
 * Canonical key for an axis tuple — axes sorted by name so `{A:a,B:b}`
 * and `{B:b,A:a}` produce the same lookup key. Used as the Map key for
 * `Project.jointOverrides` and the memoization key inside
 * `buildResolveAt`. Pure string ops; no runtime deps so the
 * browser-safe `resolve-at` subpath can use it without pulling the
 * Terrazzo parser.
 */
export function canonicalKey(tuple: Readonly<Record<string, string>>): string {
  return Object.keys(tuple)
    .toSorted()
    .map((k) => `${k}:${tuple[k]}`)
    .join('|');
}
