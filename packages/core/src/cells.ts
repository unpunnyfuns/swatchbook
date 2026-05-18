import type { Axis, Cells, TokenMap } from '#/types.ts';
import { valueKey } from '#/value-key.ts';

/**
 * Build `Project.cells` by calling `resolveTuple` once per
 * `(axis, context)` singleton. Each non-default cell is stored as a
 * **delta** — only tokens whose `$value` differs from the default-cell
 * baseline. The default cell stays as a full TokenMap and serves as
 * the baseline reference for `resolveAt`.
 *
 * Delta cells make `composeAt` correct under sparse composition:
 * `Object.assign(result, cell)` for a later axis can't accidentally
 * overwrite an earlier axis's overlay on a token the later axis
 * doesn't actually touch, because the later axis's delta cell
 * doesn't contain that token. Joint overrides handle the few cases
 * where the cartesian truth genuinely diverges from delta composition
 * (recorded by `probeJointOverrides`).
 *
 * Caller-supplied `resolveTuple` is the data source: resolver-backed
 * projects pass `resolver.apply`; layered / plain-parse projects pass
 * a lookup over the loader's per-tuple parse output. Either way,
 * `buildCells` doesn't read `Project.permutations` /
 * `permutationsResolved` — the singleton enumeration is the data
 * shape it produces, not the data shape it consumes.
 */
export function buildCells(
  axes: readonly Axis[],
  resolveTuple: (tuple: Readonly<Record<string, string>>) => TokenMap,
  defaultTuple: Readonly<Record<string, string>>,
): Cells {
  const cells: Cells = {};
  const baseline = resolveTuple(defaultTuple);
  for (const axis of axes) {
    const axisCells: Record<string, TokenMap> = {};
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) {
        axisCells[ctx] = baseline;
        continue;
      }
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const resolved = resolveTuple(cellTuple);
      const delta: TokenMap = {};
      for (const path of Object.keys(resolved)) {
        const cellValue = resolved[path];
        if (!cellValue) continue;
        if (valueKey(cellValue) !== valueKey(baseline[path])) delta[path] = cellValue;
      }
      axisCells[ctx] = delta;
    }
    cells[axis.name] = axisCells;
  }
  return cells;
}
