import { expect, it } from 'vitest';
import { deriveOpacityRows } from '#/OpacityScale.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: two in-range opacity tokens, one
// number token outside [0, 1] (must be filtered out by range), one
// non-number token (must be filtered out by type).
const resolved = {
  'number.opacity.subtle': { $type: 'number', $value: 0.2 },
  'number.opacity.strong': { $type: 'number', $value: 0.8 },
  'number.z-index.modal': { $type: 'number', $value: 10 },
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
} as unknown as ProjectData['resolved'];

const project = {
  listing: { 'number.opacity.subtle': { names: { css: '--sb-number-opacity-subtle' } } },
  cssVarPrefix: 'sb',
} as unknown as Pick<ProjectData, 'listing' | 'cssVarPrefix'>;

const opts = { type: 'number', sortBy: 'value', sortDir: 'asc' } as const;

it('produces one row per in-range number token, excluding other types and out-of-range values', () => {
  const rows = deriveOpacityRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['number.opacity.subtle', 'number.opacity.strong']);
});

it('derives the css var from the listing and the numeric opacity from the value', () => {
  const rows = deriveOpacityRows(resolved, project, opts);
  const subtle = rows.find((r) => r.path === 'number.opacity.subtle')!;
  expect(subtle.cssVar).toBe('var(--sb-number-opacity-subtle)');
  expect(subtle.opacity).toBe(0.2);
  expect(subtle.displayValue).toBe('0.2');
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const rows = deriveOpacityRows(resolved, project, opts);
  const strong = rows.find((r) => r.path === 'number.opacity.strong')!;
  expect(strong.cssVar).toBe('var(--sb-number-opacity-strong)');
});

it('applies the path filter', () => {
  const rows = deriveOpacityRows(resolved, project, { ...opts, filter: '**.strong' });
  expect(rows.map((r) => r.path)).toEqual(['number.opacity.strong']);
});

it('sorts ascending by numeric opacity by default', () => {
  const rows = deriveOpacityRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['number.opacity.subtle', 'number.opacity.strong']);
});

it('applies sortDir desc', () => {
  const rows = deriveOpacityRows(resolved, project, { ...opts, sortDir: 'desc' });
  expect(rows.map((r) => r.path)).toEqual(['number.opacity.strong', 'number.opacity.subtle']);
});

it('honors an explicit type filter of opacity', () => {
  const opacityResolved = {
    'opacity.subtle': { $type: 'opacity', $value: 0.5 },
    'number.opacity.strong': { $type: 'number', $value: 0.8 },
  } as unknown as ProjectData['resolved'];
  const rows = deriveOpacityRows(opacityResolved, project, { ...opts, type: 'opacity' });
  expect(rows.map((r) => r.path)).toEqual(['opacity.subtle']);
});
