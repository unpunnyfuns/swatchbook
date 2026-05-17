// `Project.varianceByPath` caches per-path variance analysis so
// consumers can O(1) look up which axes affect a token instead of
// running `analyzeAxisVariance` per call. These tests pin parity with
// the on-demand call (same `AxisVarianceResult` shape and contents)
// and cover that every path in the resolved data is represented.
import { beforeAll, expect, it } from 'vitest';
import { analyzeAxisVariance } from '#/variance.ts';
import type { Project } from '#/types.ts';
import { loadWithPrefix } from './_helpers.ts';

let project: Project;

beforeAll(async () => {
  project = await loadWithPrefix(undefined);
}, 30_000);

it('covers every path that appears in any permutation', () => {
  const allPaths = new Set<string>();
  for (const tokens of Object.values(project.permutationsResolved)) {
    for (const path of Object.keys(tokens)) allPaths.add(path);
  }
  for (const path of allPaths) {
    expect(project.varianceByPath.has(path), `missing variance for ${path}`).toBe(true);
  }
});

it("each cached entry equals the on-demand `analyzeAxisVariance` call for the same path", () => {
  // Spot-check three representative tokens: a constant (palette
  // primitive), a single-axis token (surface), a multi-axis token
  // (accent.fg has joint variance). Full parity is over hundreds of
  // paths; these three exercise the three `VarianceKind` branches.
  for (const path of [
    'color.palette.neutral.500',
    'color.surface.default',
    'color.accent.fg',
  ]) {
    const cached = project.varianceByPath.get(path);
    const live = analyzeAxisVariance(
      path,
      project.axes,
      project.permutations,
      project.permutationsResolved,
    );
    expect(cached).toEqual(live);
  }
});
