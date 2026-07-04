import { expect, it } from 'vitest';
import { deriveDimensionRows } from '#/DimensionScale.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: two dimensions (one rem, one px) and a
// non-dimension token that must be filtered out.
const resolved = {
  'space.sm': { $type: 'dimension', $value: { value: 0.5, unit: 'rem' } },
  'space.lg': { $type: 'dimension', $value: { value: 32, unit: 'px' } },
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
} as unknown as ProjectData['resolved'];
const project = { listing: {}, cssVarPrefix: 'sb' };
const opts = { sortBy: 'value', sortDir: 'asc', rootFontSizePx: 16 } as const;

it('includes only dimension tokens with a resolved css var and display value', () => {
  const rows = deriveDimensionRows(resolved, project, opts);
  expect(rows.map((r) => r.path)).toEqual(['space.sm', 'space.lg']);
  const sm = rows.find((r) => r.path === 'space.sm')!;
  expect(sm.cssVar).toContain('--sb-space-sm');
  expect(sm.displayValue).toBe('0.5rem');
});

it('applies the path filter', () => {
  const spaceOnly = deriveDimensionRows(resolved, project, { ...opts, filter: 'space.*' });
  expect(spaceOnly.map((r) => r.path)).toEqual(['space.sm', 'space.lg']);
  const colorOnly = deriveDimensionRows(resolved, project, { ...opts, filter: 'color.*' });
  expect(colorOnly).toEqual([]);
});

it('sorts by value using the given rootFontSizePx to convert rem to px', () => {
  // At a 16px root, 0.5rem = 8px, under space.lg's 32px.
  const at16 = deriveDimensionRows(resolved, project, { ...opts, rootFontSizePx: 16 });
  expect(at16.map((r) => r.path)).toEqual(['space.sm', 'space.lg']);

  // At a 96px root, 0.5rem = 48px, over space.lg's 32px — order flips.
  const at96 = deriveDimensionRows(resolved, project, { ...opts, rootFontSizePx: 96 });
  expect(at96.map((r) => r.path)).toEqual(['space.lg', 'space.sm']);
});
