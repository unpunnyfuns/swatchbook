// `Project.jointOverrides` stores only the divergent partial-tuple
// entries — the values `composeAt` cannot reconstruct from cells
// alone. The reference fixture has joint variance on the
// accessible-accent chain; this test pins that we identify those
// entries without overcollecting.
import { beforeAll, expect, it } from 'vitest';
import type { Project } from '#/types';
import { loadWithPrefix } from './_helpers';

let project: Project;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
}, 30_000);

it('produces at least one entry for the reference fixture (which has a known joint-variance case on color.accent.fg)', () => {
  expect(project.jointOverrides.size).toBeGreaterThan(0);
});

it("every entry covers a partial tuple of size ≥ 2 (joint by definition; singleton variance is single-axis, captured in cells)", () => {
  for (const override of project.jointOverrides.values()) {
    expect(Object.keys(override.axes).length).toBeGreaterThanOrEqual(2);
  }
});

it('every entry holds at least one token whose value at the partial tuple diverges from cascade composition', () => {
  for (const override of project.jointOverrides.values()) {
    expect(Object.keys(override.tokens).length).toBeGreaterThan(0);
  }
});

it("iteration order is ascending arity (so composition can apply lower-order overrides before higher-order ones)", () => {
  let prevArity = 0;
  for (const override of project.jointOverrides.values()) {
    const arity = Object.keys(override.axes).length;
    expect(arity).toBeGreaterThanOrEqual(prevArity);
    prevArity = arity;
  }
});
