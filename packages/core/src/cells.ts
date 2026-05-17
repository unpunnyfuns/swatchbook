import type { Axis, Cells, Permutation, TokenMap } from '#/types.ts';

/**
 * Derive `Project.cells` from the singleton permutation map. Each
 * non-default `(axis, context)` cell is stored as a **delta** —
 * only tokens whose `$value` differs from the default-cell baseline.
 * The default cell stays as a full TokenMap and serves as the
 * baseline reference for `resolveAt`.
 *
 * Delta cells make `composeAt` correct under sparse composition:
 * `Object.assign(result, cell)` for a later axis can't accidentally
 * overwrite an earlier axis's overlay on a token the later axis
 * doesn't actually touch, because the later axis's delta cell
 * doesn't contain that token. The previous full-TokenMap form
 * relied on "smart-dedup re-emit" in CSS cascade order to recover
 * the right value at multi-axis tuples; with delta cells the
 * composition is straightforwardly correct, and joint overrides
 * handle the few cases where the cartesian truth genuinely
 * diverges from delta composition (recorded by `probeJointOverrides`).
 */
export function buildCells(
  axes: readonly Axis[],
  permutations: readonly Permutation[],
  permutationsResolved: Readonly<Record<string, TokenMap>>,
  defaultTuple: Readonly<Record<string, string>>,
): Cells {
  const cells: Cells = {};
  // Locate the default (baseline) TokenMap from the default permutation.
  const defaultPerm = findPermByTuple(permutations, defaultTuple);
  const baseline = defaultPerm ? permutationsResolved[defaultPerm.name] : undefined;

  for (const axis of axes) {
    const axisCells: Record<string, TokenMap> = {};
    for (const ctx of axis.contexts) {
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const perm = findPermByTuple(permutations, cellTuple);
      if (!perm) continue;
      const resolved = permutationsResolved[perm.name];
      if (!resolved) continue;
      if (ctx === axis.default || !baseline) {
        // Default cell — keep the full TokenMap; serves as baseline.
        axisCells[ctx] = resolved;
      } else {
        // Non-default cell — store only tokens that differ from baseline.
        const delta: TokenMap = {};
        for (const path of Object.keys(resolved)) {
          const cellValue = resolved[path];
          if (!cellValue) continue;
          if (!sameValue(cellValue, baseline[path])) delta[path] = cellValue;
        }
        axisCells[ctx] = delta;
      }
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

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(getValue(a)) === JSON.stringify(getValue(b));
}

function getValue(t: unknown): unknown {
  if (t && typeof t === 'object' && '$value' in t) {
    return (t as { $value: unknown }).$value;
  }
  return undefined;
}
