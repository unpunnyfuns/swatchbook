import { describe, expect, it } from 'vitest';
import { fixedPrefixLength } from '#/ColorPalette.tsx';

describe('fixedPrefixLength', () => {
  it('returns 0 for undefined / empty', () => {
    expect(fixedPrefixLength(undefined)).toBe(0);
    expect(fixedPrefixLength('')).toBe(0);
  });

  it('counts literal segments before the first glob', () => {
    expect(fixedPrefixLength('color')).toBe(1);
    expect(fixedPrefixLength('color.sys')).toBe(2);
    expect(fixedPrefixLength('color.sys.surface')).toBe(3);
  });

  it('stops at * or **', () => {
    expect(fixedPrefixLength('color.*')).toBe(1);
    expect(fixedPrefixLength('color.ref.*')).toBe(2);
    expect(fixedPrefixLength('color.sys.surface.*')).toBe(3);
    expect(fixedPrefixLength('**')).toBe(0);
    expect(fixedPrefixLength('*')).toBe(0);
  });
});
