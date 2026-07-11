import type { AxisVariancePerAxis, AxisVarianceResult } from '#/types.ts';
import type { TokenGraph } from '#/token-graph/types.ts';
import { resolveAt } from '#/token-graph/walk.ts';
import { valueKey } from '#/value-key.ts';

/**
 * Axis names that affect `path`'s resolved value anywhere in the project —
 * a thin accessor over the graph node's precomputed `affectedBy` set.
 * Empty array (never `undefined`) for a constant token or a path not in
 * the graph.
 */
export function getAffectedBy(graph: TokenGraph, path: string): readonly string[] {
  return graph.nodes[path]?.affectedBy ?? [];
}

/**
 * Every token path in the graph, sorted lexicographically. The sort order
 * is a stated contract, not an incidental side effect of `Object.keys` —
 * consumers may rely on it for stable iteration (deterministic emission
 * order, diffable snapshots) without re-sorting themselves.
 */
export function listPaths(graph: TokenGraph): readonly string[] {
  return Object.keys(graph.nodes).toSorted();
}

/**
 * Compute how `path`'s resolved value varies across the project's axes.
 * For each axis, samples the token's value in every one of that axis's
 * contexts while holding every other axis at its default (`perAxis`) —
 * this isolates each axis's individual effect rather than reporting joint
 * behavior. `kind` discriminates on how many axes the resolved value
 * actually differs across: `constant` (none), `single` (exactly one), or
 * `multi` (two or more); see `AxisVarianceResult` for the per-kind fields.
 */
export function getVariance(graph: TokenGraph, path: string): AxisVarianceResult {
  const node = graph.nodes[path];
  const varying = node?.affectedBy ?? [];
  const constantAcross = graph.axes.filter((a) => !varying.includes(a));

  const perAxis: AxisVariancePerAxis = {};
  for (const axis of graph.axes) {
    const contexts: Record<string, string> = {};
    for (const ctx of graph.axisContexts[axis] ?? []) {
      const tuple: Record<string, string> = { ...graph.axisDefaults, [axis]: ctx };
      const value = resolveAt(graph, path, tuple);
      contexts[ctx] = valueKey(value);
    }
    perAxis[axis] = { varying: varying.includes(axis), contexts };
  }

  if (varying.length === 0) {
    return {
      path,
      kind: 'constant',
      varyingAxes: [],
      constantAcrossAxes: constantAcross,
      perAxis,
    };
  }
  if (varying.length === 1) {
    return {
      path,
      kind: 'single',
      axis: varying[0]!,
      varyingAxes: [varying[0]!],
      constantAcrossAxes: constantAcross,
      perAxis,
    };
  }
  return {
    path,
    kind: 'multi',
    varyingAxes: [varying[0]!, varying[1]!, ...varying.slice(2)],
    constantAcrossAxes: constantAcross,
    perAxis,
  };
}
