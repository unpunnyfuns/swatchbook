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

it("reproduces the fixture's joint-variance value at (Dark, Brand A) via joint overrides", () => {
  // accent.fg at {Dark, Brand A}: mode=Dark's `accessible.accent.fg`
  // overlay gives dark; Brand A alone gives white (matches baseline);
  // jointly the cartesian truth differs from the projection composition,
  // so `probeJointOverrides` records an override that `resolveAt`
  // applies to land on the correct value.
  const parserInput = project.parserInput;
  expect(parserInput?.resolver, 'reference fixture must be resolver-backed').toBeDefined();
  const cartesianTokens = parserInput?.resolver?.apply({
    ...project.defaultTuple,
    mode: 'Dark',
    brand: 'Brand A',
  });
  const expectedVal = valueKey(cartesianTokens?.['color.accent.fg']?.$value);
  const actual = project.resolveAt({ ...project.defaultTuple, mode: 'Dark', brand: 'Brand A' });
  const actualVal = valueKey(actual['color.accent.fg']?.$value);
  expect(actualVal).toBe(expectedVal);
});

it('materializes a bounded set of joint override entries (one per divergent partial tuple)', () => {
  // Bounded by `Σ_n C(axes, n) × Π_i (contexts_i - 1)` across all
  // arities that probed up a divergence — much smaller than the
  // cartesian product for typical fixtures.
  expect(project.jointOverrides.size).toBeGreaterThan(0);
  expect(project.jointOverrides.size).toBeLessThan(50);
});
