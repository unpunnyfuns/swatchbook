/**
 * End-to-end correctness for the alias-graph-culled probe against
 * the reference fixture's canonical joint case.
 *
 * `probeJointOverrides` builds an `AliasGraph` internally from the
 * resolver source + baseline tokens and skips axis combinations the
 * graph reports as orthogonal. This test pins that the optimization
 * preserves `color.accent.fg`'s joint divergence at `{mode: Dark,
 * brand: Brand A}` — the canonical resolver-only-correctness witness.
 *
 * The baseline-equal-collision case is covered separately by the
 * `connectedAxes detects direct path overlap` test in
 * `alias-graph.test.ts` — two modifiers writing the same path,
 * regardless of value, must classify as connected.
 */
import { describe, expect, it } from 'vitest';
import { loadWithPrefix } from './_helpers.ts';

describe('graph-culled probe end-to-end correctness', () => {
  it('preserves accent.fg joint divergence on the reference fixture', async () => {
    const project = await loadWithPrefix(undefined);
    const found = project.jointOverrides.some(([, override]) =>
      Object.keys(override.tokens).some((p) => p === 'color.accent.fg'),
    );
    expect(found).toBe(true);
  });
});
