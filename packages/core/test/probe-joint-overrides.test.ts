/**
 * Direct unit tests for `probeJointOverrides` — minimal synthetic
 * `axes / cells / resolver` inputs that exercise each algorithmic
 * branch without depending on the reference fixture. The fixture
 * test (`joint-overrides.test.ts`) covers end-to-end behaviour against
 * real data; these tests pin individual branches so a future fixture
 * shape change can't accidentally drop coverage of the early-returns,
 * the baseline-fallback, or the arity dedupe.
 */
import type { Resolver, TokenNormalized } from '@terrazzo/parser';
import { expect, it } from 'vitest';
import { probeJointOverrides } from '#/joint-overrides.ts';
import type { Axis, Cells, TokenMap } from '#/types.ts';

// Minimal `TokenNormalized`-shaped value for synthetic cells. Only the
// `$value` field participates in the probe's comparison (via
// `JSON.stringify($value)`), so the rest can stay sparse.
function tok(value: unknown): TokenNormalized {
  return { $value: value, $type: 'color' } as TokenNormalized;
}

// Mock Resolver: only `apply` is consulted by probeJointOverrides.
// Cast through unknown because the production Resolver interface has
// five fields (apply / listPermutations / getPermutationID / source /
// isValidInput); none of the others are reached, so a typed mock would
// be dead weight.
function mockResolver(
  apply: (input: Record<string, string>) => TokenMap,
): Resolver | undefined {
  return { apply } as unknown as Resolver;
}

it('returns empty maps when axes.length < 2 (no joint combinations to probe)', () => {
  const axes: Axis[] = [
    { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
  ];
  const cells: Cells = {
    mode: { Light: { 'color.fg': tok('white') }, Dark: { 'color.fg': tok('black') } },
  };
  const resolver = mockResolver(() => ({ 'color.fg': tok('white') }));

  const { overrides, jointTouching } = probeJointOverrides(
    axes,
    cells,
    { mode: 'Light' },
    resolver,
  );
  expect(overrides.length).toBe(0);
  expect(jointTouching.size).toBe(0);
});

it('returns empty maps when resolver is undefined (layered / plain-parse projects have no resolver to probe)', () => {
  const axes: Axis[] = [
    { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'layered' },
    { name: 'brand', contexts: ['Default', 'A'], default: 'Default', source: 'layered' },
  ];
  const cells: Cells = {};
  const { overrides, jointTouching } = probeJointOverrides(
    axes,
    cells,
    { mode: 'Light', brand: 'Default' },
    undefined,
  );
  expect(overrides.length).toBe(0);
  expect(jointTouching.size).toBe(0);
});

it('records an arity-2 override when cells composition cannot reproduce the cartesian value', () => {
  // Cells composition for {Dark, A}: baseline white → cellA(Dark)=black
  // → cellB(A) doesn't touch color.fg (matches baseline) → composed=black.
  // Resolver at {Dark, A} returns red — divergent. Override expected.
  const axes: Axis[] = [
    { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    { name: 'brand', contexts: ['Default', 'A'], default: 'Default', source: 'resolver' },
  ];
  const cells: Cells = {
    mode: { Light: { 'color.fg': tok('white') }, Dark: { 'color.fg': tok('black') } },
    brand: { Default: { 'color.fg': tok('white') }, A: {} },
  };
  const resolver = mockResolver((input) => {
    if (input.mode === 'Dark' && input.brand === 'A') return { 'color.fg': tok('red') };
    if (input.mode === 'Dark') return { 'color.fg': tok('black') };
    return { 'color.fg': tok('white') };
  });

  const { overrides, jointTouching } = probeJointOverrides(
    axes,
    cells,
    { mode: 'Light', brand: 'Default' },
    resolver,
  );
  expect(overrides.length).toBe(1);
  const entry = overrides[0]?.[1];
  expect(entry?.axes).toEqual({ mode: 'Dark', brand: 'A' });
  expect(entry?.tokens['color.fg']?.$value).toBe('red');
  // Both axes contribute (cartesian red differs from cellA black AND from cellB baseline white).
  expect(jointTouching.get('color.fg')).toEqual(new Set(['mode', 'brand']));
});

it('marks an axis as joint-touching even when the cells path falls back to baseline (delta cell omits the path)', () => {
  // cellA(Dark) has color.fg=black; cellB(A) doesn't carry color.fg
  // (matches baseline white, so dropped from the delta cell). Resolver
  // at {Dark, A} returns white. Cells composition: white → black (cellA)
  // → still black (cellB omits the path) → composed=black ≠ cartesian
  // white, so an override is recorded. But the touching check compares
  // cartesian to (cellB[path] ?? baseline[path]) — falling back to
  // baseline white matches cartesian white, so axis A (mode) is NOT
  // marked touching; only axis B (brand) is.
  const axes: Axis[] = [
    { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    { name: 'brand', contexts: ['Default', 'A'], default: 'Default', source: 'resolver' },
  ];
  const cells: Cells = {
    mode: {
      Light: { 'color.fg': tok('white') },
      Dark: { 'color.fg': tok('black') },
    },
    brand: { Default: { 'color.fg': tok('white') }, A: {} },
  };
  const resolver = mockResolver((input) => {
    if (input.mode === 'Dark' && input.brand === 'A') return { 'color.fg': tok('white') };
    if (input.mode === 'Dark') return { 'color.fg': tok('black') };
    return { 'color.fg': tok('white') };
  });

  const { jointTouching } = probeJointOverrides(
    axes,
    cells,
    { mode: 'Light', brand: 'Default' },
    resolver,
  );
  // brand is marked (cartesian white differs from cellA black);
  // mode is NOT marked (cartesian white === cellB-or-baseline white).
  expect(jointTouching.get('color.fg')).toEqual(new Set(['brand']));
});

it('marks every participating axis touching when an arity-3+ divergence is found (conservative marking, vs arity-2 leave-one-out)', () => {
  // Build a triple-joint case: pairwise resolver values match cell
  // composition (no arity-2 override), but the triple does not.
  const axes: Axis[] = [
    { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    { name: 'brand', contexts: ['Default', 'A'], default: 'Default', source: 'resolver' },
    { name: 'contrast', contexts: ['Normal', 'High'], default: 'Normal', source: 'resolver' },
  ];
  const cells: Cells = {
    mode: { Light: { 'color.fg': tok('white') }, Dark: { 'color.fg': tok('black') } },
    brand: { Default: { 'color.fg': tok('white') }, A: {} },
    contrast: { Normal: { 'color.fg': tok('white') }, High: {} },
  };
  const resolver = mockResolver((input) => {
    // Singletons / pairs all match cells composition; only the full
    // triple diverges. (Resolver returns 'red' only at the triple.)
    if (input.mode === 'Dark' && input.brand === 'A' && input.contrast === 'High') {
      return { 'color.fg': tok('red') };
    }
    if (input.mode === 'Dark') return { 'color.fg': tok('black') };
    return { 'color.fg': tok('white') };
  });

  const { overrides, jointTouching } = probeJointOverrides(
    axes,
    cells,
    { mode: 'Light', brand: 'Default', contrast: 'Normal' },
    resolver,
  );
  const tripleEntries = overrides
    .map(([, o]) => o)
    .filter((o) => Object.keys(o.axes).length === 3);
  expect(tripleEntries).toHaveLength(1);
  expect(tripleEntries[0]?.tokens['color.fg']?.$value).toBe('red');
  // Arity-3 conservative marking: every participating axis flagged.
  expect(jointTouching.get('color.fg')).toEqual(new Set(['mode', 'brand', 'contrast']));
});

it('dedupes overrides on canonical key — the same partial tuple under different iteration orders maps to one entry', () => {
  // canonicalKey sorts axis names, so {mode:Dark, brand:A} and
  // {brand:A, mode:Dark} collapse to one entry. axisCombinations
  // emits combos in declared axis order, but verify the key is
  // order-invariant by inspecting the recorded entry's key shape.
  const axes: Axis[] = [
    { name: 'brand', contexts: ['Default', 'A'], default: 'Default', source: 'resolver' },
    { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
  ];
  const cells: Cells = {
    brand: { Default: { 'color.fg': tok('white') }, A: {} },
    mode: { Light: { 'color.fg': tok('white') }, Dark: { 'color.fg': tok('black') } },
  };
  const resolver = mockResolver((input) => {
    if (input.mode === 'Dark' && input.brand === 'A') return { 'color.fg': tok('red') };
    if (input.mode === 'Dark') return { 'color.fg': tok('black') };
    return { 'color.fg': tok('white') };
  });

  const { overrides } = probeJointOverrides(
    axes,
    cells,
    { brand: 'Default', mode: 'Light' },
    resolver,
  );
  // Exactly one arity-2 entry; canonicalKey is `brand:A|mode:Dark`
  // (axis names lexicographically sorted), not `mode:Dark|brand:A`.
  expect(overrides.length).toBe(1);
  expect(overrides.map(([k]) => k)).toEqual(['brand:A|mode:Dark']);
});
