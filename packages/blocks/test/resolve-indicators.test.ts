import { expect, it } from 'vitest';
import { resolveIndicators } from '#/indicators/resolve.ts';

const DEFAULTS = {
  alias: true,
  variance: true,
  gamut: true,
  deprecation: true,
  description: false,
};

it('undefined → the established defaults', () => {
  expect(resolveIndicators(undefined)).toEqual(DEFAULTS);
});

it('false → every indicator off', () => {
  expect(resolveIndicators(false)).toEqual({
    alias: false,
    variance: false,
    gamut: false,
    deprecation: false,
    description: false,
  });
});

it('true → every indicator on, including description', () => {
  expect(resolveIndicators(true)).toEqual({
    alias: true,
    variance: true,
    gamut: true,
    deprecation: true,
    description: true,
  });
});

it('object → per-key override layered over defaults', () => {
  expect(resolveIndicators({ description: true })).toEqual({ ...DEFAULTS, description: true });
  expect(resolveIndicators({ variance: false })).toEqual({ ...DEFAULTS, variance: false });
});

it('partial object leaves unspecified keys at their default', () => {
  expect(resolveIndicators({ alias: false, description: true })).toEqual({
    ...DEFAULTS,
    alias: false,
    description: true,
  });
});
