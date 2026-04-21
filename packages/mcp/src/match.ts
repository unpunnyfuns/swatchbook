/**
 * Minimal DTCG-flavoured path matcher. Accepts exact paths (`color.bg`), single-
 * segment globs (`color.*`), multi-segment globs (`color.**`), or a trailing `*`
 * mid-segment (`color.palette.blue.*`). No brace expansion, no regex — DTCG
 * paths are dot-delimited and this matches the parity the blocks' `globMatch`
 * ships. Case-sensitive.
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
