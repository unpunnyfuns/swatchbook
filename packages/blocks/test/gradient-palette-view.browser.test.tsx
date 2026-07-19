import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { GradientPaletteView } from '#/GradientPalette.tsx';
import type { GradientPaletteViewProps, GradientRow } from '#/GradientPalette.tsx';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';

const token: RealisedToken<'gradient'> = {
  $type: 'gradient',
  $value: [
    { color: { hex: '#0066ff' }, position: 0 },
    { color: { hex: '#ffffff' }, position: 1 },
  ],
};

function rows(): GradientRow[] {
  return [
    {
      path: 'gradient.brand',
      cssVar: 'var(--sb-gradient-brand)',
      token,
      stops: [
        {
          key: 'gradient.brand|0|rgb(0% 40% 100%)',
          cssColor: 'rgb(0% 40% 100%)',
          value: '#0066ff',
          positionPercent: '0',
        },
        {
          key: 'gradient.brand|1|rgb(100% 100% 100%)',
          cssColor: 'rgb(100% 100% 100%)',
          value: '#ffffff',
          positionPercent: '100',
        },
      ],
    },
  ];
}

// The View renders + rows from plain props — no provider, no store.
function setup(extra: Partial<GradientPaletteViewProps> = {}) {
  return render(
    <GradientPaletteView
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

it('renders a row per gradient token with its path, css var, and stops', () => {
  setup();
  screen.getByText('gradient.brand');
  screen.getByText('var(--sb-gradient-brand)');
  screen.getByText('#0066ff');
  screen.getByText('#ffffff');
});

it('shows a derived caption with the total count and active theme', () => {
  setup();
  screen.getByText('1 gradient · Light');
});

it('renders an explicit caption override', () => {
  setup({ caption: 'Brand gradients' });
  screen.getByText('Brand gradients');
});

it('shows the empty state when there are no rows', () => {
  setup({ rows: [] });
  screen.getByText('No gradient tokens match this filter.');
  expect(screen.queryByText('gradient.brand')).toBeNull();
});
