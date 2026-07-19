import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { MotionPreviewView } from '#/MotionPreview.tsx';
import type { MotionPreviewViewProps, MotionRow } from '#/MotionPreview.tsx';

function rows(): MotionRow[] {
  const transitionToken: RealisedToken<'transition'> = {
    $type: 'transition',
    $value: { duration: { value: 200, unit: 'ms' }, timingFunction: [0.2, 0, 0, 1] },
  };
  const durationToken: RealisedToken<'duration'> = {
    $type: 'duration',
    $value: { value: 100, unit: 'ms' },
  };
  return [
    {
      path: 'transition.fade',
      cssVar: 'var(--sb-transition-fade)',
      token: transitionToken,
      durationMs: 200,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      kind: 'transition',
    },
    {
      path: 'duration.short',
      cssVar: 'var(--sb-duration-short)',
      token: durationToken,
      durationMs: 100,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      kind: 'duration',
    },
  ];
}

// The View renders from plain props — no provider, no store. MotionSample
// (rendered per-row) is a connected child fed this row's token/cssVar
// directly, so it needs no provider either.
function setup(extra: Partial<MotionPreviewViewProps> = {}) {
  return render(
    <MotionPreviewView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      colorFormat="hex"
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders a row per motion token with its path, spec, and css var', () => {
  setup();
  screen.getByText('transition.fade');
  screen.getByText('transition · 200ms · cubic-bezier(0.2, 0, 0, 1)');
  screen.getByText('duration.short');
  screen.getByText('duration · 100ms');
  screen.getByText('var(--sb-transition-fade)');
  screen.getByText('var(--sb-duration-short)');
});

it('shows a default caption naming the count and active theme', () => {
  setup();
  screen.getByText('2 motion tokens · Light');
});

it('honors a caption override', () => {
  setup({ caption: 'Custom caption' });
  screen.getByText('Custom caption');
});

it('mentions the filter in the default caption when set', () => {
  setup({ filter: 'transition.*' });
  screen.getByText('2 motion tokens matching `transition.*` · Light');
});

it('renders the empty state when there are no rows', () => {
  setup({ rows: [] });
  screen.getByText('No motion tokens match this filter.');
});

it('toggles the active speed button when clicked — local UI state lives in the View', async () => {
  setup();
  const oneX = screen.getByRole('button', { name: '1×' });
  const twoX = screen.getByRole('button', { name: '2×' });
  expect(oneX.className).toContain('sb-motion-preview__speed-btn--active');
  expect(twoX.className).not.toContain('sb-motion-preview__speed-btn--active');

  await userEvent.click(twoX);

  expect(twoX.className).toContain('sb-motion-preview__speed-btn--active');
  expect(oneX.className).not.toContain('sb-motion-preview__speed-btn--active');
});
