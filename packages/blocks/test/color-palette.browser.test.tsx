import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type ProjectSnapshot, SwatchbookProvider, ColorPalette } from '#/index.ts';

function makeSnapshot(): ProjectSnapshot {
  return {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    cells: {
      theme: {
        Light: {
          'color.bg': { $type: 'color', $value: { hex: '#fff' } },
          'color.fg': { $type: 'color', $value: { hex: '#111' } },
          'color.palette.blue.500': { $type: 'color', $value: { hex: '#3b82f6' } },
          'color.palette.red.500': { $type: 'color', $value: { hex: '#ef4444' } },
          'radius.sm': { $type: 'dimension', $value: { value: 4, unit: 'px' } },
        },
      },
    },
    jointOverrides: [],
    defaultTuple: { theme: 'Light' },
    activePermutation: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

describe('ColorPalette', () => {
  afterEach(() => {
    cleanup();
  });

  it('filters to color-type tokens by default and ignores dimensions', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorPalette />
      </SwatchbookProvider>,
    );
    expect(screen.queryByText('radius.sm')).toBeNull();
    expect(screen.queryByText('sm')).toBeNull();
  });

  it('narrows to the filter subtree and derives groupBy from it', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorPalette filter="color.**" />
      </SwatchbookProvider>,
    );
    // `color.*` has fixed length 1. Auto groupBy clamps so every swatch
    // keeps a leaf label — depth-2 tokens get `color.<leaf>` groups,
    // depth-4 palette tokens collapse under the shared `color.palette` group.
    screen.getByText('color.bg');
    screen.getByText('color.fg');
    screen.getByText('color.palette');
  });

  it('clamps auto-groupBy so each swatch keeps a leaf label', () => {
    // `color.palette.blue.*` has fixed length 3; with 4-segment tokens the
    // auto groupBy clamps so all blue shades land under one group with
    // their shade as the leaf.
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorPalette filter="color.palette.blue.**" />
      </SwatchbookProvider>,
    );
    screen.getByText('color.palette.blue');
    screen.getByText('500');
  });

  it('shows the empty state when the filter matches no color tokens', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorPalette filter="typography.**" />
      </SwatchbookProvider>,
    );
    screen.getByText('No color tokens match this filter.');
  });
});
