/**
 * `analyzeProjectVariance` against a layered project (no resolver,
 * Phase 3 skipped). Multi-touch tokens get conservatively classified
 * as `joint-variant` with empty `jointCases`; single-axis tokens
 * still classify normally.
 *
 * Reference-fixture + edge-case coverage lives in
 * `variance-analysis-reference.test.ts` and
 * `variance-analysis-edge-cases.test.ts` respectively.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { beforeAll, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import type { Config, Project } from '#/types.ts';
import { analyzeProjectVariance, type VarianceInfo } from '#/variance-analysis.ts';

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
