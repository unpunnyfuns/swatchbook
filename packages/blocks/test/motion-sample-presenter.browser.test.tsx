import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { MotionSample } from '#/motion-preview/MotionSample.tsx';

const token: RealisedToken<'transition'> = {
  $type: 'transition',
  $value: { duration: { value: 300, unit: 'ms' }, timingFunction: [0.2, 0, 0, 1] },
};

afterEach(() => cleanup());

// Duration always comes from the realised $value (the interval-driven ball
// needs a JS-readable number); cssVar, when given, substitutes only for the
// easing portion — see MotionSample's doc comment for why. Read the
// `transition` shorthand itself, not the `transitionTimingFunction` longhand:
// once a shorthand contains an unresolved var(), browsers can't decompose it
// into longhands, so the longhand getter reads back empty regardless.
it('renders the realised easing (no cssVar) in the transition shorthand', () => {
  const { container } = render(
    <MotionSample path="transition.fade" token={token} colorFormat="hex" />,
  );
  const ball = container.querySelector<HTMLElement>('.sb-motion-sample__ball');
  expect(ball?.style.transition).not.toBe('');
  expect(ball?.style.transition).not.toContain('var(');
});

it('prefers cssVar for the easing when supplied', () => {
  const { container } = render(
    <MotionSample
      path="transition.fade"
      token={token}
      cssVar="var(--sb-transition-fade)"
      colorFormat="hex"
    />,
  );
  const ball = container.querySelector<HTMLElement>('.sb-motion-sample__ball');
  expect(ball?.style.transition).toContain('var(--sb-transition-fade)');
});
