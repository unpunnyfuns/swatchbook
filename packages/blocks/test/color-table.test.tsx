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

  it('renders variant pills from the variants map (longest suffix wins)', () => {
    const snapshot = makeSnapshot();
    snapshot.themesResolved['Light'] = {
      ...snapshot.themesResolved['Light'],
      'color.bg.hi': { $type: 'color', $value: { hex: '#111111' } },
      'color.bg.hi-h': { $type: 'color', $value: { hex: '#222222' } },
      'color.bg.hi-d': { $type: 'color', $value: { hex: '#333333' } },
      'color.bg.hi-h-dark': { $type: 'color', $value: { hex: '#444444' } },
    };

    render(
      <SwatchbookProvider value={snapshot}>
        <ColorTable
          filter="color.bg.*"
          variants={{ hover: 'h', disabled: 'd', hoverDark: 'h-dark' }}
        />
      </SwatchbookProvider>,
    );

    const byPath = new Map<string, string | null>();
    for (const row of screen.getAllByTestId('color-table-row')) {
      const path = row.getAttribute('data-path') ?? '';
      const pill = row.querySelector('[data-testid="color-table-variant"]');
      byPath.set(path, pill?.textContent ?? null);
    }

    expect(byPath.get('color.bg.hi')).toBeNull();
    expect(byPath.get('color.bg.hi-h')).toBe('hover');
    expect(byPath.get('color.bg.hi-d')).toBe('disabled');
    expect(byPath.get('color.bg.hi-h-dark')).toBe('hoverDark');
  });

  it('ignores variants that would match characters inside a segment (neutral-900 ≠ suffix 0)', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="color.palette.*" variants={{ zero: '0' }} />
      </SwatchbookProvider>,
    );
    const pills = screen.queryAllByTestId('color-table-variant');
    expect(pills.length).toBe(0);
  });

  it('renders no pills when the variants prop is omitted', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable />
      </SwatchbookProvider>,
    );
    expect(screen.queryAllByTestId('color-table-variant').length).toBe(0);
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
