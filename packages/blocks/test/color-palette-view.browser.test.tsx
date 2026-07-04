import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ColorPaletteView } from '#/ColorPalette.tsx';
import type { ColorPaletteGroup, ColorPaletteViewProps } from '#/ColorPalette.tsx';

function groups(): ColorPaletteGroup[] {
  return [
    {
      group: 'color.brand',
      swatches: [
        {
          path: 'color.brand.bg',
          leaf: 'bg',
          cssVar: 'var(--sb-color-brand-bg)',
          value: '#0066ff',
          outOfGamut: false,
        },
        {
          path: 'color.brand.fg',
          leaf: 'fg',
          cssVar: 'var(--sb-color-brand-fg)',
          value: 'rgb(300 0 0)',
          outOfGamut: true,
        },
      ],
    },
  ];
}

// The View renders + groups from plain props — no provider, no store.
function setup(extra: Partial<ColorPaletteViewProps> = {}) {
  return render(
    <ColorPaletteView
      groups={groups()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders a swatch card per token, grouped under its section header', () => {
  setup();
  screen.getByText('color.brand');
  screen.getByText('bg');
  screen.getByText('fg');
  screen.getByText('#0066ff', { exact: false });
});

it('shows the out-of-gamut marker on a flagged swatch', () => {
  setup();
  screen.getByLabelText('out of gamut');
});

it('shows a derived caption with the total count and active theme', () => {
  setup();
  screen.getByText('2 colors · Light');
});

it('renders an explicit caption override', () => {
  setup({ caption: 'Brand colors' });
  screen.getByText('Brand colors');
});

it('shows the empty state when there are no groups', () => {
  setup({ groups: [] });
  screen.getByText('No color tokens match this filter.');
  expect(screen.queryByText('color.brand')).toBeNull();
});
