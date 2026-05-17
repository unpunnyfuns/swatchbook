// `Project.resolveAt(tuple)` is the load-time-built lazy accessor that
// replaces direct `permutationsResolved[name]` reads. These tests pin
// equivalence — for every tuple in the fixture's cartesian map,
// `resolveAt` produces the same TokenMap structure (same set of paths,
// same `$value` per path) as direct cartesian lookup. The smart-dedup
// + joint-override composition handles the joint-variance fixture
// (`color.accent.fg` under mode=Dark + brand=Brand A) without ever
// invoking the resolver again.
import { beforeAll, expect, it } from 'vitest';
import type { Project } from '#/types';
import { loadWithPrefix } from './_helpers';

let project: Project;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
}, 30_000);

function valueKey(value: unknown): string {
  return JSON.stringify(value);
}

it('matches the cartesian-resolved TokenMap for every fixture tuple, value-by-value', () => {
  for (const perm of project.permutations) {
    const expected = project.permutationsResolved[perm.name] ?? {};
    const actual = project.resolveAt(perm.input);
    const expectedPaths = Object.keys(expected).toSorted();
    const actualPaths = Object.keys(actual).toSorted();
    expect(actualPaths).toEqual(expectedPaths);
    for (const path of expectedPaths) {
      const expectedVal = valueKey(expected[path]?.$value);
      const actualVal = valueKey(actual[path]?.$value);
      expect(actualVal, `tuple=${perm.name} path=${path}`).toBe(expectedVal);
    }
  }
});

it("partial tuples fall back to each axis's default — `resolveAt({})` equals `resolveAt(defaultTuple)`", () => {
  const emptyTuple = project.resolveAt({});
  const defaultTuple = project.resolveAt(project.defaultTuple);
  expect(emptyTuple).toBe(defaultTuple);
});

it('repeated calls with the same tuple return the same instance (memoization)', () => {
  const tuple = { ...project.defaultTuple, mode: 'Dark' };
  expect(project.resolveAt(tuple)).toBe(project.resolveAt(tuple));
});

it("reproduces the fixture's joint-variance value (Dark + Brand A) via joint overrides — `accent.fg` is dark, not white", () => {
  // The joint-variance case the smart emitter chain pinned:
  // baseline accent.fg = white; under mode=Dark alone, `accessible.accent.fg`
  // overrides to a dark value; under brand=Brand A alone, accent.fg is white;
  // jointly, the cartesian resolves to the dark Brand A value, not white.
  const jointTuple = { ...project.defaultTuple, mode: 'Dark', brand: 'Brand A' };
  const expected = project.permutationsResolved['Dark · Brand A · Normal'];
  expect(expected, 'fixture missing the expected joint permutation').toBeDefined();
  const actual = project.resolveAt(jointTuple);
  const expectedVal = valueKey(expected?.['color.accent.fg']?.$value);
  const actualVal = valueKey(actual['color.accent.fg']?.$value);
  expect(actualVal).toBe(expectedVal);
});

it("doesn't materialize a joint override entry for tuples that compose correctly from cells alone", () => {
  // Sanity check: cells alone handle orthogonal-after-probe and
  // single-axis tokens, so the joint-override count is small relative
  // to the fixture's cartesian size.
  expect(project.jointOverrides.size).toBeLessThan(project.permutations.length);
});
