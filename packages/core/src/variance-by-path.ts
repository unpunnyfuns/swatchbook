import { type AxisVarianceResult, type VarianceKind } from '#/variance.ts';
import type { Axis, Cells, TokenMap } from '#/types.ts';

/**
 * Pre-compute per-path variance at load time so consumers don't have
 * to re-derive it on every read.
 *
 * Reads from the bounded `cells` surface plus the pre-built
 * `jointTouching` map (from `probeJointOverrides`). An axis is
 * marked as varying for a token if either:
 *
 *   1. **Singleton variance** — `cells[axis][ctx][path]` differs
 *      across the axis's contexts (holding other axes at their
 *      defaults).
 *   2. **Joint-only variance** — `jointTouching.get(path)` contains
 *      this axis. Catches the case where the axis's singleton
 *      values all match baseline but its effect surfaces only in
 *      joint combinations with another axis.
 *
 * The comparison key is the structural `JSON.stringify($value)` so
 * variance doesn't change with the reader's colour-format display
 * preference, and composite tokens (shadow, typography, …) compare on
 * every sub-field.
 *
 * Paths sourced from the union of every cell's tokens plus every
 * joint-touching key — covers every path that appears in any
 * resolved tuple.
 */
export function buildVarianceByPath(
  axes: readonly Axis[],
  cells: Cells,
  jointTouching: ReadonlyMap<string, ReadonlySet<string>>,
  baseline: TokenMap,
): ReadonlyMap<string, AxisVarianceResult> {
  const allPaths = new Set<string>(Object.keys(baseline));
  for (const axisCells of Object.values(cells)) {
    for (const cellTokens of Object.values(axisCells)) {
      for (const path of Object.keys(cellTokens)) allPaths.add(path);
    }
  }
  for (const path of jointTouching.keys()) allPaths.add(path);

  const out = new Map<string, AxisVarianceResult>();
  for (const path of allPaths) {
    const baselineKey = valueKey(baseline[path]);
    const perAxis: AxisVarianceResult['perAxis'] = {};
    const varyingAxes: string[] = [];
    const constantAcrossAxes: string[] = [];
    const jointTouchSet = jointTouching.get(path) ?? new Set<string>();

    for (const axis of axes) {
      const contexts: Record<string, string> = {};
      for (const ctx of axis.contexts) {
        const cellValue = cells[axis.name]?.[ctx]?.[path];
        contexts[ctx] = cellValue ? valueKey(cellValue) : baselineKey;
      }
      const singletonVarying = new Set(Object.values(contexts)).size > 1;
      const jointVarying = jointTouchSet.has(axis.name);
      const varying = singletonVarying || jointVarying;
      perAxis[axis.name] = { varying, contexts };
      (varying ? varyingAxes : constantAcrossAxes).push(axis.name);
    }

    const kind: VarianceKind =
      varyingAxes.length === 0 ? 'constant' : varyingAxes.length === 1 ? 'single' : 'multi';
    out.set(path, { path, kind, varyingAxes, constantAcrossAxes, perAxis });
  }
  return out;
}

function valueKey(token: TokenMap[string] | undefined): string {
  if (!token) return '';
  return JSON.stringify(token.$value);
}
