import { describe, expect, it } from 'vitest';
import { globMatch } from '#/internal/use-project.ts';

describe('globMatch', () => {
  it('matches everything on empty / wildcard patterns', () => {
    expect(globMatch('color.sys.bg', undefined)).toBe(true);
    expect(globMatch('color.sys.bg', '')).toBe(true);
    expect(globMatch('color.sys.bg', '*')).toBe(true);
    expect(globMatch('color.sys.bg', '**')).toBe(true);
  });

  it('matches exact path and descendants for a bare prefix', () => {
    expect(globMatch('color', 'color')).toBe(true);
    expect(globMatch('color.sys.bg', 'color')).toBe(true);
    expect(globMatch('colorscheme', 'color')).toBe(false);
  });

  it('matches `foo.*` by fixed prefix with trailing dot', () => {
    expect(globMatch('color.sys.bg', 'color.sys.*')).toBe(true);
    expect(globMatch('color.sys', 'color.sys.*')).toBe(false);
    expect(globMatch('color.ref.bg', 'color.sys.*')).toBe(false);
  });

  it('matches `foo**` by literal prefix (no dot boundary)', () => {
    expect(globMatch('colorscheme', 'color**')).toBe(true);
    expect(globMatch('color.sys', 'color**')).toBe(true);
  });

  it('rejects unsupported mid-path globs as literal segments', () => {
    // `color.*.bg` is treated as a literal path, which no real DTCG path matches.
    expect(globMatch('color.sys.bg', 'color.*.bg')).toBe(false);
  });
});
