// Pragmatic exception: `sortTokens` is an internal helper, but it's the
// one place we make the per-$type ordering decisions. Testing it directly
// catches the common regressions (asc/desc, numeric vs lexicographic,
// perceptual color order) at the source.
import { describe, expect, it } from 'vitest';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { VirtualToken } from '#/types.ts';

function entry(path: string, $type: string, $value: unknown): [string, VirtualToken] {
  return [path, { $type, $value }];
}

describe('sortTokens', () => {
  it('sorts by path ascending by default', () => {
    const input = [
      entry('color.palette.blue.500', 'color', { hex: '#3b82f6' }),
      entry('color.palette.blue.100', 'color', { hex: '#dbeafe' }),
      entry('color.palette.blue.300', 'color', { hex: '#93c5fd' }),
    ];
    const out = sortTokens(input);
    expect(out.map(([p]) => p)).toEqual([
      'color.palette.blue.100',
      'color.palette.blue.300',
      'color.palette.blue.500',
    ]);
  });

  it('respects sortDir desc for path sort', () => {
    const input = [
      entry('a', 'dimension', { value: 1, unit: 'px' }),
      entry('b', 'dimension', { value: 2, unit: 'px' }),
    ];
    const out = sortTokens(input, { by: 'path', dir: 'desc' });
    expect(out.map(([p]) => p)).toEqual(['b', 'a']);
  });

  it('sorts dimensions numerically by pixel magnitude', () => {
    const input = [
      entry('space.lg', 'dimension', { value: 2, unit: 'rem' }),
      entry('space.sm', 'dimension', { value: 4, unit: 'px' }),
      entry('space.xs', 'dimension', { value: 2, unit: 'px' }),
    ];
    const out = sortTokens(input, { by: 'value' });
    expect(out.map(([p]) => p)).toEqual(['space.xs', 'space.sm', 'space.lg']);
  });

  it('sorts fontWeight numerically', () => {
    const input = [
      entry('weight.bold', 'fontWeight', 700),
      entry('weight.regular', 'fontWeight', 400),
      entry('weight.semibold', 'fontWeight', 600),
    ];
    const out = sortTokens(input, { by: 'value' });
    expect(out.map(([p]) => p)).toEqual(['weight.regular', 'weight.semibold', 'weight.bold']);
  });

  it('sorts colors perceptually (light before dark)', () => {
    const input = [
      entry('c.black', 'color', { hex: '#000000' }),
      entry('c.white', 'color', { hex: '#ffffff' }),
      entry('c.gray', 'color', { hex: '#808080' }),
    ];
    const out = sortTokens(input, { by: 'value' });
    expect(out.map(([p]) => p)).toEqual(['c.black', 'c.gray', 'c.white']);
  });

  it('sortBy=none with dir=desc reverses input order', () => {
    const input = [
      entry('a', 'color', { hex: '#000' }),
      entry('b', 'color', { hex: '#fff' }),
      entry('c', 'color', { hex: '#888' }),
    ];
    const out = sortTokens(input, { by: 'none', dir: 'desc' });
    expect(out.map(([p]) => p)).toEqual(['c', 'b', 'a']);
  });

  it('falls back to path for composite value sort', () => {
    const input = [
      entry('shadow.md', 'shadow', [{}]),
      entry('shadow.lg', 'shadow', [{}]),
      entry('shadow.sm', 'shadow', [{}]),
    ];
    const out = sortTokens(input, { by: 'value' });
    expect(out.map(([p]) => p)).toEqual(['shadow.lg', 'shadow.md', 'shadow.sm']);
  });
});
