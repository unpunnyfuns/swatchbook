// `Project.varianceByPath` caches per-path variance analysis so
// consumers can O(1) look up which axes affect a token. These tests
// pin the shape (every resolved path is covered) and the per-kind
// classification for representative tokens. The resolver probe in
// `probeJointOverrides` is bounded by axis cardinality; the smart
// emitter continues to emit compound blocks for any genuinely
// divergent tuple, so output correctness is preserved.
import { beforeAll, expect, it } from 'vitest';
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

it('classifies representative tokens by VarianceKind', () => {
  // A palette primitive: constant across every axis.
  const palette = project.varianceByPath.get('color.palette.neutral.500');
  expect(palette?.kind).toBe('constant');

  // A single-axis token: surface varies only with mode.
  const surface = project.varianceByPath.get('color.surface.default');
  expect(surface?.kind).toBe('single');
  expect(surface?.varyingAxes).toEqual(['mode']);

  // A multi-axis token: accent.fg varies with mode + (jointly) brand
  // via the pair-level joint touching probe.
  const accent = project.varianceByPath.get('color.accent.fg');
  expect(accent?.kind).toBe('multi');
  expect(accent?.varyingAxes).toContain('mode');
  expect(accent?.varyingAxes).toContain('brand');
});
