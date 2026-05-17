// `Project.cells` is the per-axis singleton TokenMap surface that
// replaces direct reads from `permutationsResolved` for the smart
// emitter + downstream consumers. The PR-1 form derives it from the
// existing cartesian map; these tests pin the parity (every cell
// matches the corresponding singleton permutation's TokenMap) so the
// later PR that switches the load path to direct resolver calls has a
// clean equivalence baseline.
import { beforeAll, expect, it } from 'vitest';
import type { Project } from '#/types';
import { loadWithPrefix } from './_helpers';

let project: Project;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
}, 30_000);

it("populates one cell per (axis, context) — including each axis's default — for the reference fixture", () => {
  for (const axis of project.axes) {
    for (const ctx of axis.contexts) {
      expect(project.cells[axis.name]?.[ctx]).toBeDefined();
    }
  }
});

it("every cell equals the corresponding singleton permutation's TokenMap (`{ ...defaults, [axis]: ctx }`)", () => {
  const defaults: Record<string, string> = {};
  for (const axis of project.axes) defaults[axis.name] = axis.default;

  for (const axis of project.axes) {
    for (const ctx of axis.contexts) {
      const tuple = { ...defaults, [axis.name]: ctx };
      const perm = project.permutations.find((p) =>
        Object.keys(tuple).every((k) => p.input[k] === tuple[k]) &&
        Object.keys(p.input).length === Object.keys(tuple).length,
      );
      expect(perm, `missing permutation for ${JSON.stringify(tuple)}`).toBeDefined();
      const expected = project.permutationsResolved[perm!.name];
      expect(project.cells[axis.name]?.[ctx]).toBe(expected);
    }
  }
});

it('axes with disjoint context names live under their own axis keys (no cross-axis collision)', () => {
  // Every axis name is a distinct key; no axis can read another axis's cells.
  const axisNames = project.axes.map((a) => a.name);
  for (const name of axisNames) {
    expect(project.cells).toHaveProperty(name);
  }
  // Spot-check: the `mode` axis's `Dark` cell is not reachable via the
  // `brand` axis key (the cell shape is per-axis, not flat).
  expect(project.cells.brand?.Dark).toBeUndefined();
});
