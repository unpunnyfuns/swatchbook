import { expect, it } from 'vitest';
import { deriveTokenRows } from '#/TokenTable.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: one color, one deprecated dimension.
const resolved = {
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
  'space.md': { $type: 'dimension', $value: { value: 16, unit: 'px' }, $deprecated: 'use space.4' },
} as unknown as ProjectData['resolved'];
const listing = {} as ProjectData['listing'];
const varianceByPath = {} as ProjectData['varianceByPath'];
const opts = { sortBy: 'path', sortDir: 'asc', colorFormat: 'hex', rootFontSizePx: 16 } as const;

it('produces one row per resolved token with derived flags', () => {
  const rows = deriveTokenRows(resolved, listing, 'sb', varianceByPath, opts);
  expect(rows.map((r) => r.path)).toEqual(['color.brand', 'space.md']);
  const color = rows.find((r) => r.path === 'color.brand')!;
  expect(color.isColor).toBe(true);
  expect(color.isDeprecated).toBe(false);
  expect(color.cssVar).toContain('--sb-color-brand');
  const dim = rows.find((r) => r.path === 'space.md')!;
  expect(dim.isColor).toBe(false);
  expect(dim.isDeprecated).toBe(true);
});

it('applies the path filter', () => {
  const rows = deriveTokenRows(resolved, listing, 'sb', varianceByPath, {
    ...opts,
    filter: 'color.*',
  });
  expect(rows.map((r) => r.path)).toEqual(['color.brand']);
});

it('applies the $type filter', () => {
  const rows = deriveTokenRows(resolved, listing, 'sb', varianceByPath, {
    ...opts,
    type: 'dimension',
  });
  expect(rows.map((r) => r.path)).toEqual(['space.md']);
});
