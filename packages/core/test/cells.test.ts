// `Project.cells` is the per-axis surface that replaces direct reads
// from `permutationsResolved` for the smart emitter + downstream
// consumers. Default cells carry the full baseline TokenMap; non-default
// cells store deltas (only tokens whose value differs from baseline).
// Delta cells make `composeAt` correct under sparse composition — a
// later axis's cell can't accidentally overwrite an earlier axis's
// overlay on a token it doesn't touch.
import { beforeAll, expect, it } from 'vitest';
import type { Project } from '#/types.ts';
import { loadWithPrefix } from './_helpers.ts';

let project: Project;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
}, 30_000);

it("populates one cell per (axis, context) — including each axis's default — for the reference fixture", () => {
  expect(project.axes.length).toBeGreaterThan(0);
  for (const axis of project.axes) {
    for (const ctx of axis.contexts) {
      expect(project.cells[axis.name]?.[ctx]).toBeDefined();
    }
  }
});

it("the default cell on each axis IS the same baseline TokenMap reference (shared identity, not a copy)", () => {
  const [first] = project.axes;
  expect(first, 'reference fixture must have at least one axis').toBeDefined();
  if (!first) throw new Error('unreachable');
  const baseline = project.cells[first.name]?.[first.default];
  expect(baseline).toBeDefined();
  // The implementation shares the baseline reference across every
  // axis's default cell — `buildCells` writes the same object pointer
  // for `axisCells[axis.default]`. Reference equality (not just deep
  // equality) is the contract that lets `resolveAt` skip copies for
  // default-tuple lookups.
  for (const axis of project.axes) {
    expect(project.cells[axis.name]?.[axis.default]).toBe(baseline);
  }
});

it("non-default cells store only delta tokens (paths whose value differs from baseline)", () => {
  const [first] = project.axes;
  expect(first, 'reference fixture must have at least one axis').toBeDefined();
  if (!first) throw new Error('unreachable');
  const baseline = project.cells[first.name]?.[first.default] ?? {};
  for (const axis of project.axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const cell = project.cells[axis.name]?.[ctx];
      expect(cell).toBeDefined();
      // Every token in a non-default cell must differ from baseline.
      for (const [path, token] of Object.entries(cell ?? {})) {
        const baselineToken = baseline[path];
        const cellValue = JSON.stringify(token.$value);
        const baselineValue = JSON.stringify(baselineToken?.$value);
        expect(
          cellValue,
          `${axis.name}=${ctx} cell delta for ${path} should differ from baseline`,
        ).not.toBe(baselineValue);
      }
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
