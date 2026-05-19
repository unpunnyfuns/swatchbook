import type { AxisVariancePerAxis, AxisVarianceResult } from '#/types.ts';
import type { TokenGraph } from '#/token-graph/types.ts';
import { resolveAt } from '#/token-graph/walk.ts';
import { valueKey } from '#/value-key.ts';

export function getAffectedBy(graph: TokenGraph, path: string): readonly string[] {
  return graph.nodes[path]?.affectedBy ?? [];
}

export function listPaths(graph: TokenGraph): readonly string[] {
  return Object.keys(graph.nodes).toSorted();
}

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
