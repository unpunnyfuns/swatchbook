import { describe, expect, it } from 'vitest';
import { chromeAliases } from '#/internal/data-attr.ts';

describe('chromeAliases', () => {
  it('returns {} for sb prefix (no-op)', () => {
    expect(chromeAliases('sb')).toEqual({});
  });

  it('aliases to var(--<prefix>-*) for swatch', () => {
    const result = chromeAliases('swatch') as Record<string, string>;
    expect(result['--sb-color-sys-border-default']).toBe('var(--swatch-color-sys-border-default)');
    expect(result['--sb-color-sys-accent-bg']).toBe('var(--swatch-color-sys-accent-bg)');
    expect(result['--sb-typography-sys-body-font-size']).toBe(
      'var(--swatch-typography-sys-body-font-size)',
    );
  });

  it('aliases to bare var(--*) when prefix is empty', () => {
    const result = chromeAliases('') as Record<string, string>;
    expect(result['--sb-color-sys-border-default']).toBe('var(--color-sys-border-default)');
  });
});
