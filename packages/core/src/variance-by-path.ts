import { analyzeAxisVariance, type AxisVarianceResult } from '#/variance.ts';
import type { Axis, Permutation, TokenMap } from '#/types.ts';

/**
 * Pre-compute per-path variance information at load time so consumers
 * don't have to re-derive it from the cartesian map on every read.
 *
 * Today the underlying algorithm is `analyzeAxisVariance`'s
 * cartesian-bucket comparison — correct, but cartesian-dependent. The
 * later PR that drops the cartesian materialization swaps the
 * implementation here for an analytical probe over `cells` plus
 * targeted resolver calls. The consumer-facing surface
 * (`Project.varianceByPath`) stays the same across that swap.
 */
export function buildVarianceByPath(
  axes: readonly Axis[],
  permutations: readonly Permutation[],
  permutationsResolved: Readonly<Record<string, TokenMap>>,
): ReadonlyMap<string, AxisVarianceResult> {
  // The union of every token path that appears in any permutation's
  // resolved map — what `analyzeProjectVariance` uses for its own
  // path iteration.
  const allPaths = new Set<string>();
  for (const tokens of Object.values(permutationsResolved)) {
    for (const path of Object.keys(tokens)) allPaths.add(path);
  }

  const out = new Map<string, AxisVarianceResult>();
  for (const path of allPaths) {
    out.set(
      path,
      analyzeAxisVariance(
        path,
        axes,
        permutations,
        permutationsResolved as Record<string, TokenMap>,
      ),
    );
  }
  return out;
}
