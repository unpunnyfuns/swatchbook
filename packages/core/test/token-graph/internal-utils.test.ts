import { expect, it } from 'vitest';
import { isPlainObject } from '#/token-graph/internal-utils.ts';

it('accepts object literals', () => {
  expect(isPlainObject({})).toBe(true);
  expect(isPlainObject({ a: 1 })).toBe(true);
});

it('rejects null — the typeof-object trap this guard exists for', () => {
  expect(isPlainObject(null)).toBe(false);
});

it('rejects arrays', () => {
  expect(isPlainObject([])).toBe(false);
  expect(isPlainObject([1, 2])).toBe(false);
});

it('rejects primitives and undefined', () => {
  expect(isPlainObject('x')).toBe(false);
  expect(isPlainObject(42)).toBe(false);
  expect(isPlainObject(undefined)).toBe(false);
});
