import { expect, it } from 'vitest';
import { deriveMotionRows } from '#/MotionPreview.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: a transition, a duration, a cubicBezier,
// and a non-motion token that must be filtered out by default.
const resolved = {
  'transition.fade': {
    $type: 'transition',
    $value: { duration: { value: 200, unit: 'ms' }, timingFunction: [0.2, 0, 0, 1] },
  },
  'duration.short': { $type: 'duration', $value: { value: 100, unit: 'ms' } },
  'easing.standard': { $type: 'cubicBezier', $value: [0.2, 0, 0, 1] },
  'color.brand': { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 1] } },
} as unknown as ProjectData['resolved'];
const project = { listing: {}, cssVarPrefix: 'sb' };

it('includes only motion tokens by default, with a resolved css var and spec', () => {
  const rows = deriveMotionRows(resolved, project, {});
  expect(rows.map((r) => r.path)).toEqual(['easing.standard', 'duration.short', 'transition.fade']);
  const fade = rows.find((r) => r.path === 'transition.fade')!;
  expect(fade.cssVar).toContain('--sb-transition-fade');
  expect(fade.durationMs).toBe(200);
  expect(fade.easing).toBe('cubic-bezier(0.200, 0.000, 0.000, 1.000)');
  expect(fade.kind).toBe('transition');
});

it('applies the path filter', () => {
  const transitionOnly = deriveMotionRows(resolved, project, { filter: 'transition.*' });
  expect(transitionOnly.map((r) => r.path)).toEqual(['transition.fade']);
  const colorOnly = deriveMotionRows(resolved, project, { filter: 'color.*' });
  expect(colorOnly).toEqual([]);
});

it('sorts by kind first, then path', () => {
  const rows = deriveMotionRows(resolved, project, {});
  expect(rows.map((r) => r.kind)).toEqual(['cubicBezier', 'duration', 'transition']);
});
