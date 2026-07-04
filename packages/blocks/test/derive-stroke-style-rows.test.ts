import { expect, it } from 'vitest';
import { deriveStrokeStyleRows } from '#/StrokeStylePreview.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: one string strokeStyle, one object-form
// (dashed) strokeStyle, one non-strokeStyle token that must be filtered out.
const resolved = {
  'stroke.style.solid': { $type: 'strokeStyle', $value: 'solid' },
  'stroke.style.dashed': {
    $type: 'strokeStyle',
    $value: {
      dashArray: [
        { value: 4, unit: 'px' },
        { value: 2, unit: 'px' },
      ],
      lineCap: 'round',
    },
  },
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
} as unknown as ProjectData['resolved'];

const project = {
  listing: { 'stroke.style.solid': { names: { css: '--sb-stroke-style-solid' } } },
  cssVarPrefix: 'sb',
} as unknown as Pick<ProjectData, 'listing' | 'cssVarPrefix'>;

const opts = { sortBy: 'path', sortDir: 'asc' } as const;

it('produces one row per strokeStyle token, excluding other types', () => {
  const rows = deriveStrokeStyleRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['stroke.style.dashed', 'stroke.style.solid']);
});

it('derives the css var from the listing and the display value from the formatter', () => {
  const rows = deriveStrokeStyleRows(resolved, project, opts);
  const solid = rows.find((r) => r.path === 'stroke.style.solid')!;
  expect(solid.cssVar).toBe('var(--sb-stroke-style-solid)');
  expect(solid.displayValue).toBe('solid');
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const rows = deriveStrokeStyleRows(resolved, project, opts);
  const dashed = rows.find((r) => r.path === 'stroke.style.dashed')!;
  expect(dashed.cssVar).toBe('var(--sb-stroke-style-dashed)');
});

it('extracts a border-style keyword for string-form values', () => {
  const rows = deriveStrokeStyleRows(resolved, project, opts);
  const solid = rows.find((r) => r.path === 'stroke.style.solid')!;
  expect(solid.cssStyle).toBe('solid');
});

it('has no css-style keyword for object-form (dashed) values', () => {
  const rows = deriveStrokeStyleRows(resolved, project, opts);
  const dashed = rows.find((r) => r.path === 'stroke.style.dashed')!;
  expect(dashed.cssStyle).toBeNull();
});

it('applies the path filter', () => {
  const rows = deriveStrokeStyleRows(resolved, project, { ...opts, filter: '**.solid' });
  expect(rows.map((r) => r.path)).toEqual(['stroke.style.solid']);
});

it('sorts lexicographically by path by default', () => {
  const rows = deriveStrokeStyleRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['stroke.style.dashed', 'stroke.style.solid']);
});

it('applies sortDir desc', () => {
  const rows = deriveStrokeStyleRows(resolved, project, { ...opts, sortDir: 'desc' });
  expect(rows.map((r) => r.path)).toEqual(['stroke.style.solid', 'stroke.style.dashed']);
});
