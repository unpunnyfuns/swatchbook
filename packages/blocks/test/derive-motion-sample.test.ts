import { expect, it } from 'vitest';
import { deriveMotionSample } from '#/motion-preview/MotionSample.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

// Minimal hand-built resolved map: one transition token, 200ms with a
// cubic-bezier timing function.
const resolved = {
  'transition.fade': {
    $type: 'transition',
    $value: {
      duration: { value: 200, unit: 'ms' },
      timingFunction: [0.2, 0, 0, 1],
    },
  },
} as unknown as ProjectData['resolved'];

function makeProject(): Pick<ProjectData, 'resolved'> {
  return { resolved };
}

it('resolves the duration/easing spec from a transition token', () => {
  const data = deriveMotionSample('transition.fade', makeProject());
  expect(data.spec).toEqual({
    durationMs: 200,
    easing: 'cubic-bezier(0.200, 0.000, 0.000, 1.000)',
  });
});

it('returns a null spec for a path with no resolved token', () => {
  const data = deriveMotionSample('transition.missing', makeProject());
  expect(data.spec).toBeNull();
});
