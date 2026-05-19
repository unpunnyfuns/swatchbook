import type { ProjectSnapshot, VirtualTokenShape } from '#/contexts.ts';

/**
 * Build a `resolveAt` function from a `ProjectSnapshot`'s `cells` and
 * `defaultTuple`. Used in test snapshot factories to supply a working
 * `resolveAt` so the hook's `snapshotResolveAt` short-circuits to the
 * pre-built closure instead of falling back to the (absent) `tokenGraph`.
 *
 * Merges all axis cells in order: iterates over each axis in the cells
 * map, picks the context value from `tuple` (falling back to
 * `defaultTuple`), and shallow-merges the resolved map. Last-axis wins
 * on path collision, matching `buildResolveAt`'s semantics.
 *
 * Reads `cells` at call time rather than at construction time — the
 * returned closure captures the snapshot reference so tests that mutate
 * `cells` after construction (e.g. `Object.assign(snap.cells.mode.light,
 * …)`) see the updated values on the next `resolveAt` call.
 */
export function makeResolveAtFromCells(
  snapshot: Pick<ProjectSnapshot, 'cells' | 'defaultTuple'>,
): (tuple: Record<string, string>) => Record<string, VirtualTokenShape> {
  return (tuple: Record<string, string>) => {
    let result: Record<string, VirtualTokenShape> = {};
    for (const [axis, contexts] of Object.entries(snapshot.cells)) {
      const ctx = tuple[axis] ?? snapshot.defaultTuple[axis] ?? '';
      const cellTokens = contexts[ctx];
      if (cellTokens) result = { ...result, ...cellTokens };
    }
    return result;
  };
}
