import { expect, it } from 'vitest';
import { valueKey } from '#/value-key.ts';

it('returns the empty string for a missing token', () => {
  expect(valueKey(undefined)).toBe('');
  expect(valueKey({})).toBe(valueKey({ $value: undefined }));
});

it('is insensitive to object key insertion order (the load-bearing invariant)', () => {
  // A walker that reconstitutes a partial-alias composite appends the
  // aliased sub-fields last; the key must still match the original order so
  // delta detection treats the two as equal.
  const a = { $value: { color: '#000', width: '1px', style: 'solid' } };
  const b = { $value: { style: 'solid', color: '#000', width: '1px' } };
  expect(valueKey(a)).toBe(valueKey(b));
});

it('sorts keys recursively in nested objects', () => {
  const a = { $value: { outer: { x: 1, y: 2 }, z: 3 } };
  const b = { $value: { z: 3, outer: { y: 2, x: 1 } } };
  expect(valueKey(a)).toBe(valueKey(b));
});

it('distinguishes genuinely different values', () => {
  expect(valueKey({ $value: '#000' })).not.toBe(valueKey({ $value: '#fff' }));
  expect(valueKey({ $value: { a: 1 } })).not.toBe(valueKey({ $value: { a: 2 } }));
});

it('preserves array element order (arrays are not key-sorted)', () => {
  // Gradient stops / shadow layers are order-significant.
  expect(valueKey({ $value: [1, 2, 3] })).not.toBe(valueKey({ $value: [3, 2, 1] }));
});
