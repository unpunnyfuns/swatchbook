import { expect, it } from 'vitest';
import { deriveColorGroups } from '#/ColorTable.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: two colors (one deprecated), one non-color.
const resolved = {
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
  'color.legacy': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [1, 0, 0] },
    $deprecated: 'use color.brand',
  },
  'space.md': { $type: 'dimension', $value: { value: 16, unit: 'px' } },
} as unknown as ProjectData['resolved'];
const listing = {} as ProjectData['listing'];
const varianceByPath = {} as ProjectData['varianceByPath'];
const opts = { sortBy: 'path', sortDir: 'asc', colorFormat: 'hex' } as const;

it('produces one group per resolved color token, skipping non-color types', () => {
  const groups = deriveColorGroups(resolved, listing, 'sb', varianceByPath, opts);
  expect(groups.map((g) => g.base)).toEqual(['color.brand', 'color.legacy']);
});

it('carries per-variant isDeprecated, cssVar, and the active-format value', () => {
  const groups = deriveColorGroups(resolved, listing, 'sb', varianceByPath, opts);
  const brand = groups.find((g) => g.base === 'color.brand')!.variants[0]!;
  expect(brand.isDeprecated).toBe(false);
  expect(brand.cssVar).toContain('--sb-color-brand');
  expect(brand.value).toMatch(/^#/);

  const legacy = groups.find((g) => g.base === 'color.legacy')!.variants[0]!;
  expect(legacy.isDeprecated).toBe(true);
});

it('applies the path filter', () => {
  const groups = deriveColorGroups(resolved, listing, 'sb', varianceByPath, {
    ...opts,
    filter: 'color.brand',
  });
  expect(groups.map((g) => g.base)).toEqual(['color.brand']);
});

it('threads colorFormat into the active-format value', () => {
  const groups = deriveColorGroups(resolved, listing, 'sb', varianceByPath, {
    ...opts,
    colorFormat: 'hsl',
    filter: 'color.brand',
  });
  expect(groups[0]!.variants[0]!.value).toMatch(/^hsl/);
});

it('groups suffix-matched variants under a shared base with pill labels', () => {
  const withVariants = {
    ...resolved,
    'color.bg.hi': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0] } },
    'color.bg.hi-d': {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0.2, 0.2, 0.2] },
    },
  } as unknown as ProjectData['resolved'];

  const groups = deriveColorGroups(withVariants, listing, 'sb', varianceByPath, {
    ...opts,
    filter: 'color.bg.**',
    variants: { disabled: 'd' },
  });

  expect(groups).toHaveLength(1);
  const group = groups[0]!;
  expect(group.base).toBe('color.bg.hi');
  expect(group.variants.map((v) => v.label)).toEqual(['base', 'disabled']);
  expect(group.variants.map((v) => v.path)).toEqual(['color.bg.hi', 'color.bg.hi-d']);
});
