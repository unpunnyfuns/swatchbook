import uFuzzy from '@leeoniya/ufuzzy';

export interface FuzzyOptions {
  /** Cap the returned list. Applied after ranking. */
  limit?: number;
  /**
   * Allow terms to match out of authored order. `false` means `"bg prim"`
   * only matches when `bg` appears before `prim` in the haystack entry;
   * `true` also accepts `"prim bg"`. Defaults to `true` — token paths read
   * left-to-right in DTCG convention, but user queries often don't.
   */
  outOfOrder?: boolean;
}

const matcher = new uFuzzy({ intraMode: 1, interIns: 8 });

/**
 * Rank-ordered fuzzy filter. Empty / whitespace-only queries return the
 * items unchanged in their input order. Non-empty queries return only
 * matching items, ranked by uFuzzy's default scoring (boundary / prefix
 * quality, tighter matches first). Ties fall back to input order.
 *
 * The matcher is configured for short identifier-style haystacks — token
 * paths, CSS variable names — with single-character typo tolerance
 * (`intraMode: SingleError`) and generous allowance for extra characters
 * between the needle's terms (`interIns: 8`), which covers multi-segment
 * paths like `color.surface.default` searched with `"surf def"`.
 */
export function fuzzyFilter<T>(
  items: readonly T[],
  query: string,
  key: (item: T) => string,
  options: FuzzyOptions = {},
): T[] {
  const needle = query.trim();
  if (needle === '') return items.slice(0, options.limit);
  if (items.length === 0) return [];

  const haystack = items.map(key);
  const outOfOrder = options.outOfOrder ?? true;
  const [idxs, _info, order] = matcher.search(haystack, needle, outOfOrder ? 8 : 0);
  if (idxs === null) return [];

  const ranked = order ? order.map((oi) => idxs[oi] as number) : idxs;
  const out: T[] = [];
  const cap = options.limit ?? ranked.length;
  for (let i = 0; i < ranked.length && out.length < cap; i += 1) {
    const item = items[ranked[i] as number];
    if (item !== undefined) out.push(item);
  }
  return out;
}

/**
 * Test a single string against a query. Convenience wrapper for
 * single-value predicates (e.g. tree pruning where each leaf is tested
 * independently). Empty query matches everything.
 */
export function fuzzyMatches(haystack: string, query: string): boolean {
  const needle = query.trim();
  if (needle === '') return true;
  const [idxs] = matcher.search([haystack], needle, 8);
  return idxs !== null && idxs.length > 0;
}
