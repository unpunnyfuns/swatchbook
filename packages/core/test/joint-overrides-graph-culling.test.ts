/**
 * End-to-end correctness for the alias-graph-culled probe.
 *
 * `loadProject` pre-builds an `AliasGraph` from the resolver source +
 * baseline tokens and threads it into `probeJointOverrides`. The
 * probe skips axis combinations the graph reports as orthogonal.
 * These tests pin that the optimization preserves every joint
 * override the brute-force probe found:
 *
 *   - Stress fixture: 7 baseline-equal-collision divergences (the
 *     Phase-0 pinning baseline).
 *   - Reference fixture: `color.accent.fg`'s joint case at
 *     `{mode: Dark, brand: Brand A}` (the canonical resolver-only-
 *     correctness witness).
 */
import { describe, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import { loadWithPrefix } from './_helpers.ts';

describe('graph-culled probe end-to-end correctness', () => {
  it('preserves all 7 baseline-equal-collision divergences on the stress fixture', async () => {
    const project = await loadProject(
      { resolver: 'resolver.json' },
      'bench/fixtures/stress',
    );
    expect(project.jointOverrides.length).toBe(7);
    const target = project.jointOverrides.find(
      ([key]) => key === 'forced:forced|mode:dark',
    );
    expect(target?.[1].tokens['dimension.t064']).toBeDefined();
  });

  it('preserves accent.fg joint divergence on the reference fixture', async () => {
    const project = await loadWithPrefix(undefined);
    const found = project.jointOverrides.some(([, override]) =>
      Object.keys(override.tokens).some((p) => p === 'color.accent.fg'),
    );
    expect(found).toBe(true);
  });
});
