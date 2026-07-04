import { expect, it } from 'vitest';
import { deriveFontWeightRows } from '#/FontWeightScale.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: one numeric weight, one string weight,
// one non-fontWeight token that must be filtered out.
const resolved = {
  'font.weight.regular': { $type: 'fontWeight', $value: 400 },
  'font.weight.bold': { $type: 'fontWeight', $value: '700' },
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
} as unknown as ProjectData['resolved'];

const project = {
  listing: { 'font.weight.regular': { names: { css: '--sb-font-weight-regular' } } },
  cssVarPrefix: 'sb',
} as unknown as Pick<ProjectData, 'listing' | 'cssVarPrefix'>;

const opts = { sortBy: 'value', sortDir: 'asc' } as const;

it('produces one row per fontWeight token, excluding other types', () => {
  const rows = deriveFontWeightRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['font.weight.regular', 'font.weight.bold']);
});

it('derives the css var from the listing and the numeric weight from the value', () => {
  const rows = deriveFontWeightRows(resolved, project, opts);
  const regular = rows.find((r) => r.path === 'font.weight.regular')!;
  expect(regular.cssVar).toBe('var(--sb-font-weight-regular)');
  expect(regular.display).toBe('400');
  expect(regular.weight).toBe(400);
  const bold = rows.find((r) => r.path === 'font.weight.bold')!;
  expect(bold.display).toBe('700');
  expect(bold.weight).toBe(700);
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const rows = deriveFontWeightRows(resolved, project, opts);
  const bold = rows.find((r) => r.path === 'font.weight.bold')!;
  expect(bold.cssVar).toBe('var(--sb-font-weight-bold)');
});

it('applies the path filter', () => {
  const rows = deriveFontWeightRows(resolved, project, { ...opts, filter: '**.bold' });
  expect(rows.map((r) => r.path)).toEqual(['font.weight.bold']);
});

it('sorts ascending by numeric weight by default', () => {
  const rows = deriveFontWeightRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['font.weight.regular', 'font.weight.bold']);
});

it('applies sortDir desc', () => {
  const rows = deriveFontWeightRows(resolved, project, { ...opts, sortDir: 'desc' });
  expect(rows.map((r) => r.path)).toEqual(['font.weight.bold', 'font.weight.regular']);
});
