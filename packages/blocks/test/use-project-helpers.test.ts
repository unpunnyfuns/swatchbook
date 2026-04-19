import { describe, expect, it } from 'vitest';
import { formatValue, makeCssVar } from '#/internal/use-project.ts';

describe('makeCssVar', () => {
  it('wraps a dot-path as var(--prefix-name)', () => {
    expect(makeCssVar('color.sys.bg', 'sb')).toBe('var(--sb-color-sys-bg)');
  });

  it('drops the prefix segment when prefix is empty', () => {
    expect(makeCssVar('color.sys.bg', '')).toBe('var(--color-sys-bg)');
  });

  it('handles single-segment paths', () => {
    expect(makeCssVar('radius', 'swatch')).toBe('var(--swatch-radius)');
  });
});

describe('formatValue', () => {
  it('returns empty string for null / undefined', () => {
    expect(formatValue(null)).toBe('');
    expect(formatValue(undefined)).toBe('');
  });

  it('stringifies primitives', () => {
    expect(formatValue('hello')).toBe('hello');
    expect(formatValue(42)).toBe('42');
    expect(formatValue(true)).toBe('true');
  });

  it('prefers the hex field on object tokens when present', () => {
    expect(formatValue({ colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' })).toBe(
      '#ff0000',
    );
  });

  it('renders {value, unit} dimension-shaped objects as value+unit', () => {
    expect(formatValue({ value: 16, unit: 'px' })).toBe('16px');
    expect(formatValue({ value: 1.5, unit: 'rem' })).toBe('1.5rem');
  });

  it('falls through to truncated JSON for arbitrary objects', () => {
    const result = formatValue({ foo: 'bar', baz: 'qux' });
    expect(result).toBe('{"foo":"bar","baz":"qux"}');
  });

  it('truncates long JSON output to 120 chars', () => {
    const long = formatValue({ payload: 'x'.repeat(500) });
    expect(long.length).toBeLessThanOrEqual(120);
  });
});
