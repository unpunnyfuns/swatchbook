import { expect, it } from 'vitest';
import { deriveGradientRows } from '#/GradientPalette.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: two gradient tokens across two branches,
// one non-gradient token that must be filtered out.
const resolved = {
  'gradient.brand': {
    $type: 'gradient',
    $value: [
      { color: { colorSpace: 'srgb', components: [0, 0.4, 1] }, position: 0 },
      { color: { colorSpace: 'srgb', components: [1, 1, 1] }, position: 1 },
    ],
  },
  'gradient.accent': {
    $type: 'gradient',
    $value: [
      { color: { colorSpace: 'srgb', components: [0, 0, 0] }, position: 0 },
      { color: { colorSpace: 'display-p3', components: [1, 0, 0] }, position: 1 },
    ],
  },
  'color.brand.bg': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
} as unknown as ProjectData['resolved'];

const listing = {
  'gradient.brand': { names: { css: '--sb-gradient-brand' } },
} as unknown as ProjectData['listing'];

const cssVarPrefix = 'sb';

const opts = { sortBy: 'path', sortDir: 'asc', colorFormat: 'hex' } as const;

it('filters to gradient tokens, excluding other types', () => {
  const rows = deriveGradientRows(resolved, listing, cssVarPrefix, opts);
  expect(rows.map((r) => r.path)).toEqual(['gradient.accent', 'gradient.brand']);
});

it('derives the css var from the listing', () => {
  const rows = deriveGradientRows(resolved, listing, cssVarPrefix, opts);
  const brand = rows.find((r) => r.path === 'gradient.brand');
  expect(brand?.cssVar).toBe('var(--sb-gradient-brand)');
});

it('falls back to a prefix-derived css var when the listing has no entry', () => {
  const rows = deriveGradientRows(resolved, listing, cssVarPrefix, opts);
  const accent = rows.find((r) => r.path === 'gradient.accent');
  expect(accent?.cssVar).toBe('var(--sb-gradient-accent)');
});

it('formats each stop for the given colorFormat and derives its position percent', () => {
  const rows = deriveGradientRows(resolved, listing, cssVarPrefix, opts);
  const brand = rows.find((r) => r.path === 'gradient.brand');
  expect(brand?.stops.map((s) => s.value)).toEqual(['#0066ff', '#ffffff']);
  expect(brand?.stops.map((s) => s.positionPercent)).toEqual(['0', '100']);
});

it('renders each stop in its own color space rather than flattening to sRGB', () => {
  const rows = deriveGradientRows(resolved, listing, cssVarPrefix, opts);
  const accent = rows.find((r) => r.path === 'gradient.accent');
  const p3Stop = accent?.stops[1];
  expect(p3Stop?.cssColor).toContain('display-p3');
  expect(p3Stop?.cssColor).not.toMatch(/%/);
});

it('applies the path filter', () => {
  const rows = deriveGradientRows(resolved, listing, cssVarPrefix, {
    ...opts,
    filter: 'gradient.brand',
  });
  expect(rows.map((r) => r.path)).toEqual(['gradient.brand']);
});

it('applies sortDir desc', () => {
  const rows = deriveGradientRows(resolved, listing, cssVarPrefix, { ...opts, sortDir: 'desc' });
  expect(rows.map((r) => r.path)).toEqual(['gradient.brand', 'gradient.accent']);
});
