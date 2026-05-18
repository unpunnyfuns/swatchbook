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
import { analyzeProjectVariance } from '#/variance-analysis.ts';
import type { VarianceInfo } from '#/variance-analysis.ts';

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

it("classifies multi-touch tokens in a layered project as orthogonal-after-probe (Phase 3 skipped, jointCases empty)", () => {
  // `color.text` is overridden by both modes/dark.json and brands/brand-a.json
  // in this layered fixture — multi-touch by construction. The classifier's
  // top-of-file docstring claims layered projects conservatively classify
  // these as `joint-variant` with empty `jointCases`; the implementation
  // actually returns `orthogonal-after-probe` (see `variance-analysis.ts:208`
  // — when `jointCases.length === 0`, the kind is `orthogonal-after-probe`,
  // not `joint-variant`). Tracked separately; this test pins current behaviour.
  const info = variance.get('color.text');
  expect(info, 'fixture must define color.text as a multi-touch token').toBeDefined();
  expect(info?.kind).toBe('orthogonal-after-probe');
  if (info?.kind !== 'orthogonal-after-probe') throw new Error('unreachable');
  expect(info.touching).toEqual(new Set(['mode', 'brand']));
});

it('still classifies single-axis tokens normally', () => {
  // `color.surface` is touched only by mode (dark.json), not by brand.
  const info = variance.get('color.surface');
  expect(info, 'fixture must define color.surface as a single-axis token').toBeDefined();
  expect(info?.kind).toBe('single-axis');
});
