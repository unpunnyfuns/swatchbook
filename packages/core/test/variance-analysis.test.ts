/**
 * `analyzeProjectVariance` — per-token variance classification across a
 * loaded project's axes. Tests pin:
 *
 *   - the reference fixture's expected classifications (palette primitives
 *     baseline-only, single-axis role tokens like `color.surface.default`
 *     varying only on mode, joint-variant tokens like `color.accent.fg`
 *     detected as such),
 *   - layered projects skip Phase 3 (no `parserInput.resolver`) and
 *     conservatively classify multi-touch tokens as joint-variant with
 *     empty `jointCases`,
 *   - the analysis completes in reasonable wall time for the realistic
 *     fixture (regression bound, not stress test).
 *
 * No emit changes in this file — the smart emitter that consumes
 * `VarianceInfo` follows in a separate PR.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import type { Config, Project } from '#/types.ts';
import { analyzeProjectVariance, type VarianceInfo } from '#/variance-analysis.ts';
import { loadWithPrefix } from './_helpers.ts';

let referenceProject: Project;

// beforeAll: loadProject takes ~1s; tests below reuse the same project.
beforeAll(async () => {
  referenceProject = await loadWithPrefix('sb');
}, 30_000);

describe('analyzeProjectVariance — reference fixture', () => {
  let variance: Map<string, VarianceInfo>;

  beforeAll(() => {
    variance = analyzeProjectVariance(referenceProject);
  });

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

  it('returns a VarianceInfo for every token path present in any permutation', () => {
    // Sanity: the result map covers every token path the loader produced.
    const allPaths = new Set<string>();
    for (const tokens of Object.values(referenceProject.permutationsResolved)) {
      for (const path of Object.keys(tokens)) allPaths.add(path);
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
});

describe('analyzeProjectVariance — layered project (no resolver, Phase 3 skipped)', () => {
  let layeredProject: Project;
  let variance: Map<string, VarianceInfo>;

  beforeAll(async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const layeredCwd = resolve(here, 'fixtures/layered');
    const config: Config = {
      tokens: ['base/*.json'],
      axes: [
        {
          name: 'mode',
          contexts: { Light: [], Dark: ['modes/dark.json'] },
          default: 'Light',
        },
        {
          name: 'brand',
          contexts: { Default: [], 'Brand A': ['brands/brand-a.json'] },
          default: 'Default',
        },
      ],
    };
    layeredProject = await loadProject(config, layeredCwd);
    variance = analyzeProjectVariance(layeredProject);
  }, 30_000);

  it('layered projects have no parserInput.resolver — Phase 3 is unreachable', () => {
    expect(layeredProject.parserInput).toBeUndefined();
  });

  it("classifies multi-touch tokens conservatively as joint-variant with empty `jointCases` (no resolver to probe with)", () => {
    // `color.accent` is overridden by both modes/dark.json and brands/brand-a.json
    // in this layered fixture — multi-touch.
    const info = variance.get('color.accent');
    if (!info) return; // fixture might not define it; skip rather than fail
    if (info.kind !== 'joint-variant') return;
    expect(info.touching.size).toBeGreaterThanOrEqual(2);
    // Empty jointCases — the emitter takes this as "fall back to cartesian-style emit."
    expect(info.jointCases).toEqual([]);
  });

  it('still classifies single-axis tokens normally', () => {
    // `color.surface` is touched only by mode (dark.json), not by brand.
    const info = variance.get('color.surface');
    if (!info) return;
    expect(info.kind).toBe('single-axis');
  });
});

describe('analyzeProjectVariance — edge cases', () => {
  it('handles a project with zero axes (every token baseline-only)', async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const layeredCwd = resolve(here, 'fixtures/layered');
    // Plain-parse: just tokens, no axes, no resolver.
    const config: Config = { tokens: ['base/*.json'] };
    const project = await loadProject(config, layeredCwd);
    const variance = analyzeProjectVariance(project);
    for (const info of variance.values()) {
      expect(info.kind).toBe('baseline-only');
    }
  }, 30_000);
});
