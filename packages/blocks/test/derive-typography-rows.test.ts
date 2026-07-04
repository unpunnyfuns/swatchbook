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
const opts = { sortBy: 'path', sortDir: 'asc' } as const;

it('produces one row per typography token, excluding other types', () => {
  const rows = deriveTypographyRows(resolved, opts);
  expect(rows.map((r) => r.path)).toEqual(['typography.body', 'typography.heading']);
});

it('derives the sample style and specs summary from the composite value', () => {
  const rows = deriveTypographyRows(resolved, opts);
  const heading = rows.find((r) => r.path === 'typography.heading')!;
  expect(heading.sampleStyle.fontFamily).toBe('Inter');
  expect(heading.sampleStyle.fontSize).toBe('24px');
  expect(heading.sampleStyle.fontWeight).toBe('700');
  expect(heading.specs).toBe('24px · w700 · lh 1.2');
});

it('applies the path filter', () => {
  const rows = deriveTypographyRows(resolved, { ...opts, filter: '*.heading' });
  expect(rows.map((r) => r.path)).toEqual(['typography.heading']);
});

it('applies sortDir desc', () => {
  const rows = deriveTypographyRows(resolved, { ...opts, sortDir: 'desc' });
  expect(rows.map((r) => r.path)).toEqual(['typography.heading', 'typography.body']);
});
