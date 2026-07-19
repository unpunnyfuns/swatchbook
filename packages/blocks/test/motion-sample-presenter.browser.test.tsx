import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { MotionSample } from '#/motion-preview/MotionSample.tsx';

const token: RealisedToken<'transition'> = {
  $type: 'transition',
  $value: { duration: { value: 300, unit: 'ms' }, timingFunction: [0.2, 0, 0, 1] },
};

afterEach(() => cleanup());

function renderBallTransition(cssVar?: string): string | undefined {
  const { container } = render(
    <MotionSample path="transition.fade" token={token} cssVar={cssVar} colorFormat="hex" />,
  );
  return container.querySelector<HTMLElement>('.sb-motion-sample__ball')?.style.transition;
}

// Duration always comes from the realised $value (the interval-driven ball
// needs a JS-readable number). The real Terrazzo-emitted transition cssVar
// is a full duration+delay+easing shorthand, not an easing-only value, so it
// cannot be substituted into this sample's `left <dur>ms <easing>` template
// without leaving two <time> components in the shorthand, which is invalid
// at computed-value time and collapses the transition to `none`. Read the
// `transition` shorthand itself, not the `transitionTimingFunction`
// longhand: once a shorthand contains an unresolved var(), browsers can't
// decompose it into longhands, so the longhand getter reads back empty
// regardless.
it('renders a well-formed transition from the realised value when no cssVar is given', () => {
  const transition = renderBallTransition();
  expect(transition).toMatch(/^left \d+ms cubic-bezier\([-\d., ]+\)$/);
  expect(transition).not.toContain('var(');
});

it('renders an identical transition when a cssVar is supplied, proving it is not substituted into the animation', () => {
  const realised = renderBallTransition();
  cleanup();
  const withCssVar = renderBallTransition('var(--sb-transition-fade)');
  expect(withCssVar).toBe(realised);
  expect(withCssVar).not.toContain('var(');
});
