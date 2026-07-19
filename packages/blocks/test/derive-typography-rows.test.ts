import { expect, it } from 'vitest';
import { deriveTypographyRows } from '#/TypographyScale.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: one full typography spec, one
// non-typography token that must be filtered out.
const resolved = {
  'typography.heading': {
    $type: 'typography',
    $value: {
      fontFamily: 'Inter',
      fontSize: { value: 24, unit: 'px' },
      fontWeight: 700,
      lineHeight: 1.2,
    },
  },
  'typography.body': {
    $type: 'typography',
    $value: { fontFamily: 'Inter', fontSize: { value: 16, unit: 'px' } },
  },
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
} as unknown as ProjectData['resolved'];

const listing = {
  'typography.heading': { names: { css: '--sb-typography-heading' } },
} as unknown as ProjectData['listing'];

const cssVarPrefix = 'sb';
const opts = { sortBy: 'path', sortDir: 'asc' } as const;

it('produces one row per typography token, excluding other types', () => {
  const rows = deriveTypographyRows(resolved, { listing, cssVarPrefix }, opts);
  expect(rows.map((r) => r.path)).toEqual(['typography.body', 'typography.heading']);
});

it('derives the css var from the listing, and the realised token for each row', () => {
  const rows = deriveTypographyRows(resolved, { listing, cssVarPrefix }, opts);
  const heading = rows.find((r) => r.path === 'typography.heading')!;
  expect(heading.cssVar).toBe('var(--sb-typography-heading)');
  expect(heading.token.$value).toEqual(resolved['typography.heading']!.$value);
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const rows = deriveTypographyRows(resolved, { listing, cssVarPrefix }, opts);
  const body = rows.find((r) => r.path === 'typography.body');
  expect(body?.cssVar).toBe('var(--sb-typography-body)');
});

it('applies the path filter', () => {
  const rows = deriveTypographyRows(
    resolved,
    { listing, cssVarPrefix },
    { ...opts, filter: '*.heading' },
  );
  expect(rows.map((r) => r.path)).toEqual(['typography.heading']);
});

it('applies sortDir desc', () => {
  const rows = deriveTypographyRows(
    resolved,
    { listing, cssVarPrefix },
    { ...opts, sortDir: 'desc' },
  );
  expect(rows.map((r) => r.path)).toEqual(['typography.heading', 'typography.body']);
});
