import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import { DimensionScaleView } from '#/DimensionScale.tsx';
import type { DimensionRow, DimensionScaleViewProps } from '#/DimensionScale.tsx';

function rows(): DimensionRow[] {
  return [
    { path: 'space.sm', cssVar: 'var(--sb-space-sm)', displayValue: '0.5rem' },
    { path: 'space.lg', cssVar: 'var(--sb-space-lg)', displayValue: '32px' },
  ];
}

// The View renders from plain props — no provider, no store. DimensionSample
// (rendered per-row) is a connected child that reads the project itself; it
// falls back to an empty snapshot with no provider mounted, which is fine
// here since only the View's own output is under test.
function setup(extra: Partial<DimensionScaleViewProps> = {}) {
  return render(
    <DimensionScaleView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      visual="length"
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders a row per dimension token with its css var and display value', () => {
  setup();
  screen.getByText('space.sm');
  screen.getByText('0.5rem');
  screen.getByText('space.lg');
  screen.getByText('32px');
  screen.getByText('var(--sb-space-sm)');
  screen.getByText('var(--sb-space-lg)');
});

it('shows a default caption naming the count and active theme', () => {
  setup();
  screen.getByText('2 dimensions · Light');
});

it('honors a caption override', () => {
  setup({ caption: 'Custom caption' });
  screen.getByText('Custom caption');
});

it('mentions the filter in the default caption when set', () => {
  setup({ filter: 'space.*' });
  screen.getByText('2 dimensions matching `space.*` · Light');
});

it('renders the empty state when there are no rows', () => {
  setup({ rows: [] });
  screen.getByText('No dimension tokens match this filter.');
});
