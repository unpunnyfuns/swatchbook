import { expect, it } from 'vitest';
import { resolveIndicators } from '#/indicators/resolve.ts';

const DEFAULTS = {
  alias: true,
  variance: true,
  gamut: true,
  deprecation: true,
  description: false,
  composes: false,
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
    composes: false,
  });
});

it('true → every indicator on, including description', () => {
  expect(resolveIndicators(true)).toEqual({
    alias: true,
    variance: true,
    gamut: true,
    deprecation: true,
    description: true,
    composes: true,
  });
});

it('composes is opt-in: off by default, settable via object', () => {
  expect(resolveIndicators(undefined).composes).toBe(false);
  expect(resolveIndicators({ composes: true })).toEqual({ ...DEFAULTS, composes: true });
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
