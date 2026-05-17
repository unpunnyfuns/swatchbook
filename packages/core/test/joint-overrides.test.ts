// `Project.jointOverrides` stores only the divergent partial-tuple
// entries — the values `composeAt` cannot reconstruct from cells
// alone. The reference fixture has joint variance on the
// accessible-accent chain; this test pins that we identify those
// entries without overcollecting.
import { beforeAll, expect, it } from 'vitest';
import type { Project } from '#/types.ts';
import { loadWithPrefix } from './_helpers';

let project: Project;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
}, 30_000);

it('produces at least one entry for the reference fixture (which has a known joint-variance case on color.accent.fg)', () => {
  expect(project.jointOverrides.length).toBeGreaterThan(0);
});

it("every entry covers a partial tuple of size ≥ 2 (joint by definition; singleton variance is single-axis, captured in cells)", () => {
  for (const [, override] of project.jointOverrides) {
    expect(Object.keys(override.axes).length).toBeGreaterThanOrEqual(2);
  }
});

it('every entry holds at least one token whose value at the partial tuple diverges from cascade composition', () => {
  for (const [, override] of project.jointOverrides) {
    expect(Object.keys(override.tokens).length).toBeGreaterThan(0);
  }
});

it("iteration order is ascending arity (so composition can apply lower-order overrides before higher-order ones)", () => {
  let prevArity = 0;
  for (const [, override] of project.jointOverrides) {
    const arity = Object.keys(override.axes).length;
    expect(arity).toBeGreaterThanOrEqual(prevArity);
    prevArity = arity;
  }
});

it('exercises the arity-3 branch — the fixture produces at least one triple-axis override entry', () => {
  // probeJointOverrides walks arity 2..N. The arity-3+ branch
  // marks every participating axis touching conservatively (vs
  // arity-2's per-axis leave-one-out check) and dedupes via
  // canonicalKey across arity passes. The fixture's
  // {brand:'Brand A', contrast:High, mode:Dark} entry exists because
  // pair-composition can't reproduce the triple-joint accessible-accent
  // values; pin that the branch is reachable so future fixture changes
  // don't silently drop the only real-data coverage of the arity-3 loop.
  const triples = project.jointOverrides
    .map(([, override]) => override)
    .filter((o) => Object.keys(o.axes).length === 3);
  expect(triples.length).toBeGreaterThan(0);
  for (const triple of triples) {
    expect(Object.keys(triple.tokens).length).toBeGreaterThan(0);
  }
});

it('marks an axis as joint-touching even when its singleton cell matches baseline (variance surfaces via the joint probe, not the per-axis cell)', () => {
  // `color.accent.fg`: brand at default mode produces white, matching
  // baseline white — brand's singleton cell records no divergence. Yet
  // brand still appears in varianceByPath.varyingAxes because the joint
  // probe at {mode:Dark, brand:'Brand A'} marks brand touching
  // (Brand A's resolver overrides accent.fg=white where Dark's cell
  // alone gives dark). Pins that the two signals — singleton + joint —
  // both flow into varyingAxes.
  const variance = project.varianceByPath.get('color.accent.fg');
  expect(variance?.kind).toBe('multi');
  expect(variance?.varyingAxes).toContain('brand');
  // Brand's per-axis singleton contexts match (no singleton effect).
  const brandContexts = variance?.perAxis['brand']?.contexts ?? {};
  const brandValues = new Set(Object.values(brandContexts));
  expect(brandValues.size).toBe(1);
});
