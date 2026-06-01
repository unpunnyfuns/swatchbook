/**
 * Branded canonical-tuple-key type. Structurally `string` so JSON
 * serialization / `Map` lookups behave identically at runtime; the
 * brand catches places that pass arbitrary strings (token paths, axis
 * names, theme display names) into a context expecting a canonical
 * tuple key.
 *
 * Produced by {@link canonicalKey}.
 */
export type TupleKey = string & { readonly __brand: 'TupleKey' };

/**
 * Canonical key for an axis tuple — axes sorted by name so `{A:a,B:b}`
 * and `{B:b,A:a}` produce the same lookup key.
 */
export function canonicalKey(tuple: Readonly<Record<string, string>>): TupleKey {
  return Object.keys(tuple)
    .toSorted()
    .map((k) => `${k}:${tuple[k]}`)
    .join('|') as TupleKey;
}
