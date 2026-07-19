import { expect, it } from 'vitest';
import { deriveColorPaletteGroups } from '#/ColorPalette.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: three color tokens across two branches,
// one non-color token that must be filtered out.
const resolved = {
  'color.brand.bg': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
  'color.brand.fg': { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1] } },
  'color.text.muted': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0.5, 0.5, 0.5] },
  },
  'radius.sm': { $type: 'dimension', $value: { value: 4, unit: 'px' } },
} as unknown as ProjectData['resolved'];

const listing = {
  'color.brand.bg': { names: { css: '--sb-color-brand-bg' } },
} as unknown as ProjectData['listing'];

const cssVarPrefix = 'sb';

const opts = { sortBy: 'path', sortDir: 'asc' } as const;

it('groups color tokens under the derived default groupBy, excluding other types', () => {
  const groups = deriveColorPaletteGroups(resolved, listing, cssVarPrefix, opts);
  expect(groups.map((g) => g.group)).toEqual(['color']);
  expect(groups[0]?.swatches.map((s) => s.path)).toEqual([
    'color.brand.bg',
    'color.brand.fg',
    'color.text.muted',
  ]);
  // Group is 'color' (1 segment); leaf is the group-relative remainder.
  expect(groups[0]?.swatches.map((s) => s.leaf)).toEqual(['brand.bg', 'brand.fg', 'text.muted']);
});

it('derives the css var from the listing and carries the realised token for the presenter', () => {
  const groups = deriveColorPaletteGroups(resolved, listing, cssVarPrefix, opts);
  const bg = groups[0]?.swatches.find((s) => s.path === 'color.brand.bg');
  expect(bg?.cssVar).toBe('var(--sb-color-brand-bg)');
  expect(bg?.token).toEqual(resolved['color.brand.bg']);
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const groups = deriveColorPaletteGroups(resolved, listing, cssVarPrefix, opts);
  const muted = groups[0]?.swatches.find((s) => s.path === 'color.text.muted');
  expect(muted?.cssVar).toBe('var(--sb-color-text-muted)');
});

it('applies an explicit groupBy over the derived default', () => {
  const groups = deriveColorPaletteGroups(resolved, listing, cssVarPrefix, { ...opts, groupBy: 2 });
  expect(groups.map((g) => g.group)).toEqual(['color.brand', 'color.text']);
  expect(groups[0]?.swatches.map((s) => s.path)).toEqual(['color.brand.bg', 'color.brand.fg']);
  expect(groups[1]?.swatches.map((s) => s.path)).toEqual(['color.text.muted']);
});

it('applies the path filter', () => {
  const groups = deriveColorPaletteGroups(resolved, listing, cssVarPrefix, {
    ...opts,
    filter: 'color.brand.**',
  });
  expect(groups.map((g) => g.group)).toEqual(['color.brand']);
  expect(groups[0]?.swatches.map((s) => s.path)).toEqual(['color.brand.bg', 'color.brand.fg']);
});

it('applies sortDir desc within a group', () => {
  const groups = deriveColorPaletteGroups(resolved, listing, cssVarPrefix, {
    ...opts,
    groupBy: 2,
    sortDir: 'desc',
  });
  const brand = groups.find((g) => g.group === 'color.brand');
  expect(brand?.swatches.map((s) => s.path)).toEqual(['color.brand.fg', 'color.brand.bg']);
});

it('carries the group-relative remainder as leaf for a deep path under a shallow group', () => {
  // color.palette.blue.50 has 4 segments; grouping at depth 2 ('color.palette')
  // must keep 'blue' in the label, not just the last segment ('50').
  const deepResolved = {
    'color.palette.blue.50': {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0.9, 0.95, 1] },
    },
    'color.palette.blue.500': {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0.2, 0.4, 0.9] },
    },
  } as unknown as ProjectData['resolved'];
  const groups = deriveColorPaletteGroups(deepResolved, listing, cssVarPrefix, {
    ...opts,
    groupBy: 2,
  });
  expect(groups.map((g) => g.group)).toEqual(['color.palette']);
  expect(groups[0]?.swatches.map((s) => s.leaf)).toEqual(['blue.50', 'blue.500']);
});
