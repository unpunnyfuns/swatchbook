import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type ProjectSnapshot, SwatchbookProvider, ColorPalette } from '#/index.ts';

function makeSnapshot(): ProjectSnapshot {
  return {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    themes: [{ name: 'Light', input: { theme: 'Light' }, sources: [] }],
    themesResolved: {
      Light: {
        'color.sys.bg': { $type: 'color', $value: { hex: '#fff' } },
        'color.sys.fg': { $type: 'color', $value: { hex: '#111' } },
        'color.ref.blue.500': { $type: 'color', $value: { hex: '#3b82f6' } },
        'color.ref.red.500': { $type: 'color', $value: { hex: '#ef4444' } },
        'radius.sm': { $type: 'dimension', $value: { value: 4, unit: 'px' } },
      },
    },
    activeTheme: 'Light',
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
        <ColorPalette filter='color.sys.*' />
      </SwatchbookProvider>,
    );
    // `color.sys.*` has fixed length 2. Tokens below max out at depth 3,
    // so groupBy clamps to 2 — one `color.sys` group header with `bg` and
    // `fg` as leaves. Out-of-filter refs don't appear.
    expect(screen.getByText('color.sys')).toBeDefined();
    expect(screen.getByText('bg')).toBeDefined();
    expect(screen.getByText('fg')).toBeDefined();
    expect(screen.queryByText('color.ref.blue.500')).toBeNull();
  });

  it('clamps auto-groupBy so each swatch keeps a leaf label', () => {
    // `color.ref.blue.*` has fixed length 3; with 4-segment tokens the
    // auto groupBy clamps so all blue shades land under one group with
    // their shade as the leaf.
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorPalette filter='color.ref.blue.*' />
      </SwatchbookProvider>,
    );
    expect(screen.getByText('color.ref.blue')).toBeDefined();
    expect(screen.getByText('500')).toBeDefined();
  });

  it('shows the empty state when the filter matches no color tokens', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorPalette filter='typography.*' />
      </SwatchbookProvider>,
    );
    expect(screen.getByText('No color tokens match this filter.')).toBeDefined();
  });
});
