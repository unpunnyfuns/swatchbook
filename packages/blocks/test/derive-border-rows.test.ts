import { expect, it } from 'vitest';
import { deriveBorderRows } from '#/BorderPreview.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: two border tokens, one non-border token
// that must be filtered out.
const resolved = {
  'border.default': {
    $type: 'border',
    $value: {
      color: { colorSpace: 'srgb', components: [0, 0, 0] },
      width: { value: 1, unit: 'px' },
      style: 'solid',
    },
  },
  'border.focus': {
    $type: 'border',
    $value: {
      color: { colorSpace: 'srgb', components: [0, 0.4, 1] },
      width: { value: 2, unit: 'px' },
      style: 'dashed',
    },
  },
  'color.brand.bg': { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1] } },
} as unknown as ProjectData['resolved'];

const listing = {
  'border.default': { names: { css: '--sb-border-default' } },
} as unknown as ProjectData['listing'];

const cssVarPrefix = 'sb';
const project = { listing, cssVarPrefix };

const opts = { sortBy: 'path', sortDir: 'asc', colorFormat: 'hex' } as const;

it('filters to border tokens only, sorted by path', () => {
  const rows = deriveBorderRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['border.default', 'border.focus']);
});

it('derives the css var from the listing when present', () => {
  const rows = deriveBorderRows(resolved, project, opts);
  const row = rows.find((r) => r.path === 'border.default');
  expect(row?.cssVar).toBe('var(--sb-border-default)');
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const rows = deriveBorderRows(resolved, project, opts);
  const row = rows.find((r) => r.path === 'border.focus');
  expect(row?.cssVar).toBe('var(--sb-border-focus)');
});

it('formats the width, style and color per the given colorFormat', () => {
  const rows = deriveBorderRows(resolved, project, opts);
  const row = rows.find((r) => r.path === 'border.focus');
  expect(row?.width).toBe('2px');
  expect(row?.style).toBe('dashed');
  expect(row?.color).toBe('#0066ff');
});

it('applies the path filter', () => {
  const rows = deriveBorderRows(resolved, project, { ...opts, filter: 'border.focus' });
  expect(rows.map((r) => r.path)).toEqual(['border.focus']);
});

it('applies sortDir desc', () => {
  const rows = deriveBorderRows(resolved, project, { ...opts, sortDir: 'desc' });
  expect(rows.map((r) => r.path)).toEqual(['border.focus', 'border.default']);
});
