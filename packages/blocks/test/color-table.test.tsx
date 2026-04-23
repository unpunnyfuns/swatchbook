import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ColorTable, type ProjectSnapshot, SwatchbookProvider } from '#/index.ts';

function makeSnapshot(): ProjectSnapshot {
  return {
    axes: [{ name: 'mode', contexts: ['light'], default: 'light', source: 'resolver' }],
    disabledAxes: [],
    presets: [],
    themes: [{ name: 'Light', input: { mode: 'light' }, sources: [] }],
    themesResolved: {
      Light: {
        'color.surface.default': {
          $type: 'color',
          $value: { hex: '#ffffff' },
        },
        'color.text.default': {
          $type: 'color',
          $value: { hex: '#111111' },
          aliasOf: 'color.palette.neutral.900',
        },
        'color.palette.neutral.900': {
          $type: 'color',
          $value: { hex: '#111111' },
        },
        'space.md': {
          $type: 'dimension',
          $value: { value: 16, unit: 'px' },
        },
      },
    },
    activeTheme: 'Light',
    activeAxes: { mode: 'light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

describe('ColorTable', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders only $type: color tokens (skips the dimension row)', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable />
      </SwatchbookProvider>,
    );

    const rows = screen.getAllByTestId('color-table-row');
    const paths = rows.map((r) => r.getAttribute('data-path')).toSorted();
    expect(paths).toEqual([
      'color.palette.neutral.900',
      'color.surface.default',
      'color.text.default',
    ]);
  });

  it('shows HEX, HSL, OKLCH, CSS var, and alias columns per row', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="color.text.default" />
      </SwatchbookProvider>,
    );

    const row = screen.getByTestId('color-table-row');
    expect(within(row).getByText('#111111')).toBeDefined();
    expect(within(row).getByText(/var\(--sb-color-text-default\)/)).toBeDefined();
    expect(within(row).getByText('color.palette.neutral.900')).toBeDefined();
    // HSL + OKLCH are stringified by formatColor; just assert their copy buttons exist.
    const hslCopy = within(row).queryByLabelText(/Copy HSL/);
    const oklchCopy = within(row).queryByLabelText(/Copy OKLCH/);
    expect(hslCopy).not.toBeNull();
    expect(oklchCopy).not.toBeNull();
  });

  it('renders an em-dash in the alias column for non-aliased tokens', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="color.surface.*" />
      </SwatchbookProvider>,
    );
    const row = screen.getByTestId('color-table-row');
    const alias = row.querySelector('.sb-color-table__alias');
    expect(alias?.textContent?.trim()).toBe('—');
  });

  it('fuzzy search narrows rows and survives out-of-order terms', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable />
      </SwatchbookProvider>,
    );

    const input = screen.getByTestId('color-table-search') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'default text' } });

    const rows = screen.getAllByTestId('color-table-row');
    expect(rows.length).toBe(1);
    expect(rows[0]?.getAttribute('data-path')).toBe('color.text.default');
  });

  it('renders the empty state when the filter matches no colors', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="typography.*" />
      </SwatchbookProvider>,
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('No color tokens match this filter.')).toBeDefined();
  });

  it('clicking a row opens the DetailOverlay by default', async () => {
    const { findByTestId } = render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable />
      </SwatchbookProvider>,
    );
    const rows = screen.getAllByTestId('color-table-row');
    rows[0]?.click();
    expect(await findByTestId('color-table-overlay')).toBeDefined();
  });

  it('clicking a copy button does not bubble into the row click', () => {
    const picks: string[] = [];
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable onSelect={(p) => picks.push(p)} filter="color.surface.*" />
      </SwatchbookProvider>,
    );
    const copy = screen.getAllByLabelText(/Copy HEX/)[0];
    copy?.click();
    expect(picks.length).toBe(0);
  });
});
