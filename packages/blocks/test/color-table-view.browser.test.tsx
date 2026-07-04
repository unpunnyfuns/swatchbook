import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, it } from 'vitest';
import { ColorTableView } from '#/ColorTable.tsx';
import type { ColorGroup, ColorTableViewProps, ColorVariant } from '#/ColorTable.tsx';
import { resolveIndicators } from '#/indicators/resolve.ts';

function groups(): ColorGroup[] {
  const brand: ColorVariant = {
    label: 'base',
    path: 'color.brand',
    cssVar: 'var(--sb-color-brand)',
    token: {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0, 0.4, 1] },
    } as ColorVariant['token'],
    variance: undefined,
    value: '#0066ff',
    outOfGamut: false,
    hex: '#0066ff',
    hsl: 'hsl(216 100% 50%)',
    oklch: 'oklch(0.55 0.2 250)',
    isDeprecated: false,
  };
  const legacy: ColorVariant = {
    label: 'base',
    path: 'color.legacy',
    cssVar: 'var(--sb-color-legacy)',
    token: {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [1, 0, 0] },
      $deprecated: 'use color.brand',
    } as ColorVariant['token'],
    variance: undefined,
    value: '#ff0000',
    outOfGamut: false,
    hex: '#ff0000',
    hsl: 'hsl(0 100% 50%)',
    oklch: 'oklch(0.63 0.26 29)',
    isDeprecated: true,
  };
  return [
    { base: 'color.brand', variants: [brand], searchText: 'color.brand #0066ff' },
    { base: 'color.legacy', variants: [legacy], searchText: 'color.legacy #ff0000' },
  ];
}

// The View renders + filters from plain props — no provider, no store. Row
// activation only toggles the built-in inline expansion (no project access
// needed), so that stays covered by the connector-level expansion tests.
function setup(extra: Partial<ColorTableViewProps> = {}) {
  return render(
    <ColorTableView
      groups={groups()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      colorFormat="hex"
      enabledIndicators={resolveIndicators(undefined, {})}
      blockKey="test::ColorTable"
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders a row per group with its active value', () => {
  setup();
  screen.getByText('color.brand');
  screen.getByText('color.legacy');
  expect(screen.getAllByTestId('color-table-row')).toHaveLength(2);
});

it('narrows visible rows via the search input', async () => {
  setup();
  await userEvent.type(screen.getByTestId('color-table-search'), 'brand');
  expect(screen.getAllByTestId('color-table-row')).toHaveLength(1);
  screen.getByText('color.brand');
});
