/**
 * `analyzeProjectVariance` edge cases — degenerate inputs (zero-axis
 * projects) the reference + layered tests don't exercise.
 *
 * Reference-fixture + layered coverage lives in
 * `variance-analysis-reference.test.ts` and
 * `variance-analysis-layered.test.ts` respectively.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import type { Config } from '#/types.ts';
import { analyzeProjectVariance } from '#/variance-analysis.ts';

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
