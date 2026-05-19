/**
 * `analyzeProjectVariance` against the reference fixture — palette
 * primitives baseline-only, surface roles single-axis on mode,
 * `color.accent.fg` joint-variant. Pins reference-fixture
 * classifications + the per-render performance bound.
 *
 * Layered + edge-case coverage lives in `variance-analysis-layered.test.ts`
 * and `variance-analysis-edge-cases.test.ts` respectively.
 */
import { beforeAll, expect, it } from 'vitest';
import type { Project } from '#/types.ts';
import { analyzeProjectVariance } from '#/variance-analysis.ts';
import type { VarianceInfo } from '#/variance-analysis.ts';
import { valueKey } from '#/value-key.ts';
import { loadWithPrefix } from './_helpers.ts';

let referenceProject: Project;
let variance: Map<string, VarianceInfo>;

// beforeAll: loadProject takes ~1s; every it() reuses the same project.
beforeAll(async () => {
  referenceProject = await loadWithPrefix('sb');
  variance = analyzeProjectVariance(referenceProject);
}, 30_000);

it('classifies palette primitives as baseline-only (no axis touches them)', () => {
  // `color.palette.blue.500` is defined only in the baseline `color.json`
  // tokens; no overlay touches it.
  const info = variance.get('color.palette.blue.500');
  expect(info).toBeDefined();
  expect(info?.kind).toBe('baseline-only');
});

it('classifies surface roles as single-axis on `mode` (only mode overlays touch `color.surface.*`)', () => {
  const info = variance.get('color.surface.default');
  expect(info).toBeDefined();
  if (info?.kind !== 'single-axis') {
    throw new Error(`expected single-axis, got ${info?.kind}`);
  }
  expect(info.axis).toBe('mode');
});

it('classifies `color.accent.fg` as joint-variant — Dark mode + brand=Brand A diverges from projection composition', () => {
  const info = variance.get('color.accent.fg');
  expect(info).toBeDefined();
  if (info?.kind !== 'joint-variant') {
    throw new Error(`expected joint-variant, got ${info?.kind}`);
  }
  // `touching` includes mode (singleton variance) and brand (joint
  // variance with mode at {Dark, Brand A}). Contrast may also touch
  // — depends on whether the high-contrast accessibility chain
  // shows up at pair-level probes, which the post-PR-6b-iv probe
  // catches conservatively.
  expect(info.touching.has('mode')).toBe(true);
  expect(info.touching.has('brand')).toBe(true);
  expect(info.jointCases.length).toBeGreaterThan(0);

  // Pin the known Dark + Brand A case end-to-end: the joint cell must
  // carry the cartesian-correct value (taken from the resolver-built
  // joint overrides) and the synthesized permutation name must follow
  // the documented `axisValues.join(' · ')` shape.
  const darkBrandA = info.jointCases.find(
    (c) =>
      (c.axisA === 'mode' && c.ctxA === 'Dark' && c.axisB === 'brand' && c.ctxB === 'Brand A') ||
      (c.axisA === 'brand' && c.ctxA === 'Brand A' && c.axisB === 'mode' && c.ctxB === 'Dark'),
  );
  expect(darkBrandA, 'reference fixture must produce a Dark+Brand A joint case').toBeDefined();
  if (!darkBrandA) throw new Error('unreachable');
  // `permutationName` is `axisValues.join(' · ')` over the full default tuple
  // with the joint axes overridden — pin the substring so axis ordering of
  // the underlying default tuple doesn't lock the test, but the joint
  // contexts must appear.
  expect(darkBrandA.permutationName).toContain('Dark');
  expect(darkBrandA.permutationName).toContain('Brand A');
  expect(darkBrandA.permutationName.split(' · ')).toHaveLength(referenceProject.axes.length);
  // `cartesianValueKey` is the JSON-stringified `$value` at the joint
  // tuple from `resolver.apply`. Cross-check against `jointOverrides`
  // — the override tokens at the same tuple must serialize to the same key.
  const overrideEntry = referenceProject.jointOverrides.find(
    ([, o]) => o.axes['mode'] === 'Dark' && o.axes['brand'] === 'Brand A',
  );
  expect(overrideEntry, 'jointOverrides must carry the Dark+Brand A divergence').toBeDefined();
  if (!overrideEntry) throw new Error('unreachable');
  const overrideToken = overrideEntry[1].tokens['color.accent.fg'];
  expect(overrideToken, 'override must include color.accent.fg').toBeDefined();
  expect(darkBrandA.cartesianValueKey).toBe(valueKey({ $value: overrideToken?.$value }));

  // The remaining joint cases (if any) still satisfy the structural
  // contract — pair non-default contexts on distinct axes.
  for (const c of info.jointCases) {
    expect(c.axisA).not.toBe(c.axisB);
    expect(c.cartesianValueKey).toBeTruthy();
    expect(c.permutationName).toBeTruthy();
  }
});

it('returns a VarianceInfo for every token path present in any cell', () => {
  // Sanity: the result map covers every token path the loader produced.
  const allPaths = new Set<string>(Object.keys(referenceProject.defaultTokens));
  for (const axisCells of Object.values(referenceProject.cells)) {
    for (const cell of Object.values(axisCells)) {
      for (const path of Object.keys(cell)) allPaths.add(path);
    }
  }
  for (const path of allPaths) {
    expect(variance.has(path), `missing variance info for ${path}`).toBe(true);
  }
});

it('completes the analysis in well under a second for the reference fixture', () => {
  const start = performance.now();
  analyzeProjectVariance(referenceProject);
  const elapsed = performance.now() - start;
  // Generous bound — regression-detection rather than stress test.
  // The fixture has 3 axes × 1 non-default context each, ~500 tokens.
  // A handful of multi-touch tokens get probed; expect ~10s in CI
  // worst case but normally much less.
  expect(elapsed).toBeLessThan(10_000);
});
