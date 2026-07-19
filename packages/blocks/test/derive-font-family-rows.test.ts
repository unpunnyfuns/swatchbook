import { expect, it } from 'vitest';
import { deriveFontFamilyRows } from '#/FontFamilyPreview.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: one string-form family, one array-form
// stack, one non-fontFamily token that must be filtered out.
const resolved = {
  'font.family.body': { $type: 'fontFamily', $value: 'Inter' },
  'font.family.mono': { $type: 'fontFamily', $value: ['Fira Code', 'monospace'] },
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
} as unknown as ProjectData['resolved'];

const project = {
  listing: { 'font.family.body': { names: { css: '--sb-font-family-body' } } },
  cssVarPrefix: 'sb',
} as unknown as Pick<ProjectData, 'listing' | 'cssVarPrefix'>;

const opts = { sortBy: 'path', sortDir: 'asc' } as const;

it('produces one row per fontFamily token, excluding other types', () => {
  const rows = deriveFontFamilyRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['font.family.body', 'font.family.mono']);
});

it('derives the css var from the listing and carries the realised token', () => {
  const rows = deriveFontFamilyRows(resolved, project, opts);
  const body = rows.find((r) => r.path === 'font.family.body')!;
  expect(body.cssVar).toBe('var(--sb-font-family-body)');
  expect(body.token.$value).toBe('Inter');
  const mono = rows.find((r) => r.path === 'font.family.mono')!;
  expect(mono.token.$value).toEqual(['Fira Code', 'monospace']);
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const rows = deriveFontFamilyRows(resolved, project, opts);
  const mono = rows.find((r) => r.path === 'font.family.mono')!;
  expect(mono.cssVar).toBe('var(--sb-font-family-mono)');
});

it('applies the path filter', () => {
  const rows = deriveFontFamilyRows(resolved, project, { ...opts, filter: '**.mono' });
  expect(rows.map((r) => r.path)).toEqual(['font.family.mono']);
});

it('applies sortDir desc', () => {
  const rows = deriveFontFamilyRows(resolved, project, { ...opts, sortDir: 'desc' });
  expect(rows.map((r) => r.path)).toEqual(['font.family.mono', 'font.family.body']);
});
