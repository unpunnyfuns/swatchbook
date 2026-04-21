import { describe, expect, it } from 'vitest';
import { matchPath } from '#/match.ts';

describe('matchPath', () => {
  it('returns true for every path when the filter is omitted or "**"', () => {
    expect(matchPath('color.accent.bg', undefined)).toBe(true);
    expect(matchPath('color.accent.bg', '**')).toBe(true);
    expect(matchPath('', '*')).toBe(true);
  });

  it('matches an exact dot-path', () => {
    expect(matchPath('color.accent.bg', 'color.accent.bg')).toBe(true);
    expect(matchPath('color.accent.bg', 'color.accent.fg')).toBe(false);
  });

  it('single-segment `*` matches one segment only', () => {
    expect(matchPath('color.bg', 'color.*')).toBe(true);
    expect(matchPath('color.accent.bg', 'color.*')).toBe(false);
    expect(matchPath('color.accent.bg', 'color.*.bg')).toBe(true);
  });

  it('double-star `**` matches any number of trailing segments', () => {
    expect(matchPath('color.palette.blue.500', 'color.**')).toBe(true);
    expect(matchPath('color', 'color.**')).toBe(true);
    expect(matchPath('typography.body', 'color.**')).toBe(false);
  });

  it('double-star `**` also matches interior segments', () => {
    expect(matchPath('color.palette.blue.500', 'color.**.500')).toBe(true);
    expect(matchPath('color.palette.blue.700', 'color.**.500')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(matchPath('Color.bg', 'color.bg')).toBe(false);
  });
});
