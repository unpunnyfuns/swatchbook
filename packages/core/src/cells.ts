import type { Axis, Cells, Permutation, TokenMap } from '#/types.ts';

/**
 * Derive `Project.cells` from the existing cartesian-shaped permutation
 * data. One entry per `(axis, context)` — pulled from the singleton
 * permutation whose tuple is `{ ...defaultTuple, [axisName]: contextName }`.
 *
 * This is the additive form: shipped on `Project` alongside the
 * existing `permutationsResolved` so downstream consumers can adopt
 * the cells shape without changing the load path. A follow-up PR
 * switches `loadResolverPermutations` to populate `cells` directly via
 * `resolver.apply` per `(axis, context)`, at which point the cartesian
 * map goes away and this derivation does too.
 */
export function buildCells(
  axes: readonly Axis[],
  permutations: readonly Permutation[],
  permutationsResolved: Readonly<Record<string, TokenMap>>,
  defaultTuple: Readonly<Record<string, string>>,
): Cells {
  const cells: Cells = {};
  for (const axis of axes) {
    const axisCells: Record<string, TokenMap> = {};
    for (const ctx of axis.contexts) {
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const perm = findPermByTuple(permutations, cellTuple);
      if (!perm) continue;
      const resolved = permutationsResolved[perm.name];
      if (resolved) axisCells[ctx] = resolved;
    }
    cells[axis.name] = axisCells;
  }
  return cells;
}

function findPermByTuple(
  permutations: readonly Permutation[],
  tuple: Readonly<Record<string, string>>,
): Permutation | undefined {
  const keys = Object.keys(tuple);
  return permutations.find((perm) => {
    for (const key of keys) {
      if (perm.input[key] !== tuple[key]) return false;
    }
    return Object.keys(perm.input).length === keys.length;
  });
}
