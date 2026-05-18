/**
 * Browser-safe DTCG-flavoured path matcher. Exported through the
 * `@unpunnyfuns/swatchbook-core/match-path` subpath so both the
 * blocks-side `<TypographyScale>` / `<DimensionScale>` / etc. filters
 * and the MCP `list_tokens` / `search_tokens` tools share one
 * implementation — the matcher consumers reach for stays in lockstep.
 *
 * Accepts:
 *   - exact paths (`color.accent.bg`)
 *   - single-segment wildcard (`color.*`, `color.*.bg`)
 *   - multi-segment trailing globstar (`color.**`)
 *   - multi-segment interior globstar (`color.**.500`)
 *
 * No brace expansion, no regex, no character classes — DTCG paths are
 * dot-delimited and this matches what consumers actually want. Case-
 * sensitive.
 */
export function matchPath(path: string, filter: string | undefined): boolean {
  if (!filter) return true;
  if (filter === '**' || filter === '*') return true;

  const pathSegments = path.split('.');
  const filterSegments = filter.split('.');

  let pi = 0;
  let fi = 0;
  while (fi < filterSegments.length) {
    const fseg = filterSegments[fi];
    if (fseg === '**') {
      // Match zero or more path segments. The next filter segment must match
      // somewhere in the remaining path, or we accept the tail.
      if (fi === filterSegments.length - 1) return true;
      const remaining = filterSegments.slice(fi + 1);
      for (let k = pi; k <= pathSegments.length; k++) {
        if (matchPath(pathSegments.slice(k).join('.'), remaining.join('.'))) {
          return true;
        }
      }
      return false;
    }
    if (pi >= pathSegments.length) return false;
    const pseg = pathSegments[pi];
    if (fseg === '*') {
      // pass
    } else if (fseg !== pseg) {
      return false;
    }
    pi++;
    fi++;
  }
  return pi === pathSegments.length;
}
