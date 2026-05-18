/**
 * Branded canonical-tuple-key type. Structurally `string` so JSON
 * serialization / `Map` lookups behave identically at runtime; the
 * brand catches places that pass arbitrary strings (token paths, axis
 * names, theme display names) into a context expecting a canonical
 * tuple key, which used to all compile as plain `string`.
 *
 * Produced by {@link canonicalKey} and {@link jointOverrideKey}.
 */
export type TupleKey = string & { readonly __brand: 'TupleKey' };

/**
 * Canonical key for an axis tuple — axes sorted by name so `{A:a,B:b}`
 * and `{B:b,A:a}` produce the same lookup key. Used as the Map key for
 * `Project.jointOverrides` and the memoization key inside
 * `buildResolveAt`. Pure string ops; no runtime deps so the
 * browser-safe `resolve-at` subpath can use it without pulling the
 * Terrazzo parser.
 */
export function canonicalKey(tuple: Readonly<Record<string, string>>): TupleKey {
  return Object.keys(tuple)
    .toSorted()
    .map((k) => `${k}:${tuple[k]}`)
    .join('|') as TupleKey;
}
