import { expect, it } from 'vitest';
import { permutationID } from '#/types.ts';

it('returns the context value directly for single-axis tuples', () => {
  expect(permutationID({ theme: 'Light' })).toBe('Light');
});

it('joins multi-axis tuple values with " · " in insertion order', () => {
  expect(permutationID({ mode: 'Dark', brand: 'Brand A' })).toBe('Dark · Brand A');
});

it('returns empty string for empty tuples', () => {
  expect(permutationID({})).toBe('');
});
