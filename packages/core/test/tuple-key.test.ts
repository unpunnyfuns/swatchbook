import { expect, it } from 'vitest';
import { canonicalKey } from '#/tuple-key.ts';

it('joins axis entries as sorted `name:value` pairs', () => {
  expect(canonicalKey({ mode: 'Dark', brand: 'Acme' })).toBe('brand:Acme|mode:Dark');
});

it('is independent of key insertion order — the memo-dedup invariant', () => {
  // load.ts and css-axis-projected both key Maps on this; two tuples with
  // the same effective selection must produce one key regardless of order.
  expect(canonicalKey({ a: '1', b: '2' })).toBe(canonicalKey({ b: '2', a: '1' }));
});

it('produces the empty string for the empty tuple', () => {
  expect(canonicalKey({})).toBe('');
});

it('handles a single axis', () => {
  expect(canonicalKey({ mode: 'Light' })).toBe('mode:Light');
});
