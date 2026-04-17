import { describe, expect, it } from 'vitest';
import { defineSwatchbookConfig, resolveThemingMode } from '#/config';

describe('defineSwatchbookConfig', () => {
  it('returns the config unchanged (identity helper)', () => {
    const input = { tokens: ['t/**'], resolver: 't/resolver.json' };
    expect(defineSwatchbookConfig(input)).toBe(input);
  });
});

describe('resolveThemingMode', () => {
  it('returns "layered" when themes is set', () => {
    expect(
      resolveThemingMode({
        tokens: [],
        themes: [{ name: 'light', layers: ['ref/**'] }],
      }),
    ).toBe('layered');
  });

  it('returns "resolver" when resolver is set', () => {
    expect(resolveThemingMode({ tokens: [], resolver: 'r.json' })).toBe('resolver');
  });

  it('throws when no theming input is set', () => {
    expect(() => resolveThemingMode({ tokens: [] })).toThrow(/must specify one of/);
  });

  it('throws when themes array is empty', () => {
    expect(() => resolveThemingMode({ tokens: [], themes: [] })).toThrow(/must specify one of/);
  });

  it('throws when multiple theming inputs are set', () => {
    expect(() =>
      resolveThemingMode({
        tokens: [],
        themes: [{ name: 'light', layers: ['ref/**'] }],
        resolver: 'r.json',
      }),
    ).toThrow(/exactly one theming input/);
  });
});
