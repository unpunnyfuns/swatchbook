import { expect, it } from 'vitest';
import { deriveShadowRows } from '#/ShadowPreview.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: one single-layer shadow, one layered
// (array) shadow with an inset second layer, and one non-shadow token that
// must be filtered out.
const resolved = {
  'shadow.default': {
    $type: 'shadow',
    $value: {
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: 2, unit: 'px' },
      blur: { value: 4, unit: 'px' },
      spread: { value: 0, unit: 'px' },
      color: { colorSpace: 'srgb', components: [0, 0, 0] },
    },
  },
  'shadow.layered': {
    $type: 'shadow',
    $value: [
      {
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 1, unit: 'px' },
        blur: { value: 2, unit: 'px' },
        spread: { value: 0, unit: 'px' },
        color: { colorSpace: 'srgb', components: [0, 0, 0] },
      },
      {
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 4, unit: 'px' },
        blur: { value: 8, unit: 'px' },
        spread: { value: 0, unit: 'px' },
        color: { colorSpace: 'srgb', components: [0, 0.4, 1] },
        inset: true,
      },
    ],
  },
  'color.brand.bg': { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1] } },
} as unknown as ProjectData['resolved'];

const listing = {
  'shadow.default': { names: { css: '--sb-shadow-default' } },
} as unknown as ProjectData['listing'];

const cssVarPrefix = 'sb';
const project = { listing, cssVarPrefix };

const opts = { sortBy: 'path', sortDir: 'asc', colorFormat: 'hex' } as const;

it('filters to shadow tokens only, sorted by path', () => {
  const rows = deriveShadowRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['shadow.default', 'shadow.layered']);
});

it('derives the css var from the listing when present', () => {
  const rows = deriveShadowRows(resolved, project, opts);
  const row = rows.find((r) => r.path === 'shadow.default');
  expect(row?.cssVar).toBe('var(--sb-shadow-default)');
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const rows = deriveShadowRows(resolved, project, opts);
  const row = rows.find((r) => r.path === 'shadow.layered');
  expect(row?.cssVar).toBe('var(--sb-shadow-layered)');
});

it('formats a single-layer shadow value and color per the given colorFormat', () => {
  const rows = deriveShadowRows(resolved, project, opts);
  const row = rows.find((r) => r.path === 'shadow.default');
  expect(row?.layers).toEqual([
    { offset: '0px 2px', blur: '4px', spread: '0px', color: '#000000', inset: undefined },
  ]);
});

it('formats every layer of a multi-layer shadow, carrying inset only where set', () => {
  const rows = deriveShadowRows(resolved, project, opts);
  const row = rows.find((r) => r.path === 'shadow.layered');
  expect(row?.layers).toEqual([
    { offset: '0px 1px', blur: '2px', spread: '0px', color: '#000000', inset: undefined },
    { offset: '0px 4px', blur: '8px', spread: '0px', color: '#0066ff', inset: 'true' },
  ]);
});

it('applies the path filter', () => {
  const rows = deriveShadowRows(resolved, project, { ...opts, filter: 'shadow.layered' });
  expect(rows.map((r) => r.path)).toEqual(['shadow.layered']);
});

it('applies sortDir desc', () => {
  const rows = deriveShadowRows(resolved, project, { ...opts, sortDir: 'desc' });
  expect(rows.map((r) => r.path)).toEqual(['shadow.layered', 'shadow.default']);
});
