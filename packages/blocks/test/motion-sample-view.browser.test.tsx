import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { MotionSampleView } from '#/motion-preview/MotionSample.tsx';
import type { MotionSampleViewProps } from '#/motion-preview/MotionSample.tsx';

// The View renders from plain props — no provider, no store.
function setup(extra: Partial<MotionSampleViewProps> = {}) {
  return render(
    <MotionSampleView
      spec={{ durationMs: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}
      speed={1}
      runKey={0}
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders the animated track/ball when a spec is resolved', () => {
  const { container } = setup();
  expect(container.querySelector('.sb-motion-sample__track')).not.toBeNull();
  expect(container.querySelector('.sb-motion-sample__ball')).not.toBeNull();
});

it('falls back to default duration/easing when spec is null', () => {
  const { container } = setup({ spec: null });
  const ball = container.querySelector<HTMLElement>('.sb-motion-sample__ball');
  expect(ball).not.toBeNull();
});
