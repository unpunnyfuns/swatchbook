import { expect, it } from 'vitest';
import { deriveDimensionBar } from '#/dimension-scale/DimensionBar.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: one dimension token, 2rem.
const resolved = {
  'space.lg': { $type: 'dimension', $value: { value: 2, unit: 'rem' } },
} as unknown as ProjectData['resolved'];

function makeProject(
  listing: Pick<ProjectData, 'listing'>['listing'] = {},
): Pick<ProjectData, 'resolved' | 'listing' | 'cssVarPrefix'> {
  return { resolved, listing, cssVarPrefix: 'sb' };
}

it('resolves the css var from the listing when present', () => {
  const project = makeProject({
    'space.lg': { names: { css: '--tz-space-lg' } },
  } as unknown as ProjectData['listing']);
  const bar = deriveDimensionBar('space.lg', project, 16);
  expect(bar.cssVar).toBe('var(--tz-space-lg)');
});

it('falls back to the prefix-derived css var when the listing has no entry', () => {
  const bar = deriveDimensionBar('space.lg', makeProject(), 16);
  expect(bar.cssVar).toContain('--sb-space-lg');
});

it('converts the resolved value to px using the given rootFontSizePx', () => {
  expect(deriveDimensionBar('space.lg', makeProject(), 16).pxValue).toBe(32);
  expect(deriveDimensionBar('space.lg', makeProject(), 8).pxValue).toBe(16);
});

it('caps at MAX_RENDER_PX (480) once the resolved px exceeds it', () => {
  // 2rem at a 300px root = 600px, over the 480 cap.
  const bar = deriveDimensionBar('space.lg', makeProject(), 300);
  expect(bar.capped).toBe(true);
  expect(bar.cappedValue).toBe('480px');
});

it('leaves cappedValue equal to the css var when under the cap', () => {
  const bar = deriveDimensionBar('space.lg', makeProject(), 16);
  expect(bar.capped).toBe(false);
  expect(bar.cappedValue).toBe(bar.cssVar);
});
