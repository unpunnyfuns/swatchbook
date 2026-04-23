import { expect, it } from 'vitest';
import { fuzzyFilter, fuzzyMatches } from '#/fuzzy.ts';

const paths = [
  'color.surface.default',
  'color.surface.subtle',
  'color.text.default',
  'color.palette.blue.500',
  'color.palette.orange.600',
  'space.md',
  'space.lg',
  'radius.sm',
];

it('returns items unchanged for empty and whitespace queries', () => {
  expect(fuzzyFilter(paths, '', (p) => p)).toEqual(paths);
  expect(fuzzyFilter(paths, '   ', (p) => p)).toEqual(paths);
});

it('returns empty list when nothing matches', () => {
  expect(fuzzyFilter(paths, 'zzzz', (p) => p)).toEqual([]);
});

it('finds prefix-like matches across dot-separated segments', () => {
  const hits = fuzzyFilter(paths, 'surf def', (p) => p);
  expect(hits).toContain('color.surface.default');
});

it('accepts terms out of authored order by default', () => {
  const hits = fuzzyFilter(paths, 'blue palette', (p) => p);
  expect(hits).toContain('color.palette.blue.500');
});

it('ranks tighter matches above looser ones', () => {
  const hits = fuzzyFilter(paths, 'surface', (p) => p);
  expect(hits.slice(0, 2)).toEqual(
    expect.arrayContaining(['color.surface.default', 'color.surface.subtle']),
  );
});

it('tolerates a single-character typo', () => {
  const hits = fuzzyFilter(paths, 'surfce', (p) => p);
  expect(hits).toContain('color.surface.default');
});

it('respects the limit option', () => {
  const hits = fuzzyFilter(paths, 'color', (p) => p, { limit: 2 });
  expect(hits).toHaveLength(2);
});

it('fuzzyMatches mirrors fuzzyFilter for single haystacks', () => {
  expect(fuzzyMatches('color.surface.default', 'surf def')).toBe(true);
  expect(fuzzyMatches('color.surface.default', 'zzzz')).toBe(false);
  expect(fuzzyMatches('anything', '')).toBe(true);
});
