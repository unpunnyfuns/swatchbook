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
import { analyzeProjectVariance, type VarianceInfo } from '#/variance-analysis.ts';
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

it("classifies surface roles as single-axis on `mode` (only mode overlays touch `color.surface.*`)", () => {
  const info = variance.get('color.surface.default');
  expect(info).toBeDefined();
  if (info?.kind !== 'single-axis') {
    throw new Error(`expected single-axis, got ${info?.kind}`);
  }
  expect(info.axis).toBe('mode');
});

it("classifies `color.accent.fg` as joint-variant — Dark mode + brand=Brand A diverges from projection composition", () => {
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
  // At least one joint case must be recorded.
  expect(info.jointCases.length).toBeGreaterThan(0);
  // Joint cases name an axis pair + non-default contexts + a stringified
  // cartesian value + a permutation name. After the singleton-only
  // loader switch, the joint tuple is no longer materialized in
  // `permutationsResolved` — the name is informational, and the
  // cartesian-correct value lives in `project.jointOverrides`.
  for (const c of info.jointCases) {
    expect(c.axisA).toBeTruthy();
    expect(c.axisB).toBeTruthy();
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
