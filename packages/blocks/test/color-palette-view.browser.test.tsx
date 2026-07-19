import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ColorPaletteView } from '#/ColorPalette.tsx';
import type { ColorPaletteGroup, ColorPaletteViewProps } from '#/ColorPalette.tsx';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';

const blueToken: RealisedToken<'color'> = { $type: 'color', $value: { hex: '#0066ff' } };
// Out-of-gamut in sRGB (rgb component past 255): exercises the ⚠ marker.
const oorToken: RealisedToken<'color'> = {
  $type: 'color',
  $value: { colorSpace: 'srgb', components: [300 / 255, 0, 0] },
};

function groups(): ColorPaletteGroup[] {
  return [
    {
      group: 'color.brand',
      swatches: [
        {
          path: 'color.brand.bg',
          cssVar: 'var(--sb-color-brand-bg)',
          leaf: 'bg',
          token: blueToken,
        },
        {
          path: 'color.brand.fg',
          cssVar: 'var(--sb-color-brand-fg)',
          leaf: 'fg',
          token: oorToken,
        },
      ],
    },
  ];
}

// The View renders + groups from plain props: no provider, no store.
function setup(extra: Partial<ColorPaletteViewProps> = {}) {
  return render(
    <ColorPaletteView
      groups={groups()}
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

it('passes the group-relative leaf through to the swatch label, not just the last path segment', () => {
  setup({
    groups: [
      {
        group: 'color.palette',
        swatches: [
          {
            path: 'color.palette.blue.50',
            cssVar: 'var(--sb-color-palette-blue-50)',
            leaf: 'blue.50',
            token: blueToken,
          },
        ],
      },
    ],
  });
  screen.getByText('blue.50');
  expect(screen.queryByText('50')).toBeNull();
});
