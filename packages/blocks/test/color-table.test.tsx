import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ColorTable, type ProjectSnapshot, SwatchbookProvider } from '#/index.ts';

function makeSnapshot(): ProjectSnapshot {
  return {
    axes: [{ name: 'mode', contexts: ['light'], default: 'light', source: 'resolver' }],
    disabledAxes: [],
    presets: [],
    permutations: [{ name: 'Light', input: { mode: 'light' }, sources: [] }],
    permutationsResolved: {
      Light: {
        'color.surface.default': {
          $type: 'color',
          $value: { hex: '#ffffff' },
        },
        'color.text.default': {
          $type: 'color',
          $value: { hex: '#111111' },
          $description: 'Primary text on default surfaces.',
          aliasOf: 'color.palette.neutral.900',
          aliasChain: ['color.palette.neutral.900'],
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
    activePermutation: 'Light',
    activeAxes: { mode: 'light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

describe('ColorTable — base rendering', () => {
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

  it('shows the active-format value, CSS var, and alias columns per row', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="color.text.default" />
      </SwatchbookProvider>,
    );

    const row = screen.getByTestId('color-table-row');
    // Default color-format context is 'hex' — so the single value column is the hex.
    expect(within(row).getByText('#111111')).toBeDefined();
    expect(within(row).getByText(/var\(--sb-color-text-default\)/)).toBeDefined();
    expect(within(row).getByText('color.palette.neutral.900')).toBeDefined();
    // Per-format HSL / OKLCH copy buttons shouldn't exist on the collapsed row.
    expect(within(row).queryByLabelText(/Copy HSL/)).toBeNull();
    expect(within(row).queryByLabelText(/Copy OKLCH/)).toBeNull();
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

  it('fuzzy search narrows rows with out-of-order terms', () => {
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

  it('renders no variant pills when the variants prop is omitted', () => {
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
    const copy = screen.getAllByLabelText(/Copy value/)[0];
    copy?.click();
    expect(picks.length).toBe(0);
  });
});

describe('ColorTable — grouping', () => {
  afterEach(() => {
    cleanup();
  });

  function makeVariantSnapshot(): ProjectSnapshot {
    const base = makeSnapshot();
    base.permutationsResolved['Light'] = {
      ...base.permutationsResolved['Light'],
      'color.bg.hi': { $type: 'color', $value: { hex: '#111111' } },
      'color.bg.hi-h': { $type: 'color', $value: { hex: '#222222' } },
      'color.bg.hi-d': { $type: 'color', $value: { hex: '#333333' } },
    };
    return base;
  }

  it('collapses sibling variants into one row with a pill per variant', () => {
    render(
      <SwatchbookProvider value={makeVariantSnapshot()}>
        <ColorTable filter="color.bg.*" variants={{ hover: 'h', disabled: 'd' }} />
      </SwatchbookProvider>,
    );

    const rows = screen.getAllByTestId('color-table-row');
    const bases = rows.map((r) => r.getAttribute('data-base'));
    expect(bases).toContain('color.bg.hi');
    expect(bases.filter((b) => b === 'color.bg.hi').length).toBe(1);

    const hiRow = rows.find((r) => r.getAttribute('data-base') === 'color.bg.hi');
    if (!hiRow) throw new Error('group row not found');
    const pills = within(hiRow).getAllByTestId('color-table-variant');
    const labels = pills.map((p) => p.textContent);
    expect(labels).toEqual(['base', 'hover', 'disabled']);
  });

  it('defaults to the "base" variant when one is present', () => {
    render(
      <SwatchbookProvider value={makeVariantSnapshot()}>
        <ColorTable filter="color.bg.*" variants={{ hover: 'h', disabled: 'd' }} />
      </SwatchbookProvider>,
    );

    const hiRow = screen
      .getAllByTestId('color-table-row')
      .find((r) => r.getAttribute('data-base') === 'color.bg.hi');
    if (!hiRow) throw new Error('group row not found');
    expect(hiRow.getAttribute('data-path')).toBe('color.bg.hi');
    expect(within(hiRow).getByText('#111111')).toBeDefined();
  });

  it('clicking a pill swaps the active variant and the displayed values', () => {
    render(
      <SwatchbookProvider value={makeVariantSnapshot()}>
        <ColorTable filter="color.bg.*" variants={{ hover: 'h', disabled: 'd' }} />
      </SwatchbookProvider>,
    );

    const hiRowInitial = screen
      .getAllByTestId('color-table-row')
      .find((r) => r.getAttribute('data-base') === 'color.bg.hi');
    if (!hiRowInitial) throw new Error('group row not found');
    const disabledPill = within(hiRowInitial)
      .getAllByTestId('color-table-variant')
      .find((p) => p.textContent === 'disabled');
    if (!disabledPill) throw new Error('disabled pill not found');
    act(() => {
      fireEvent.click(disabledPill);
    });

    const hiRow = screen
      .getAllByTestId('color-table-row')
      .find((r) => r.getAttribute('data-base') === 'color.bg.hi');
    if (!hiRow) throw new Error('group row after click not found');
    expect(hiRow.getAttribute('data-path')).toBe('color.bg.hi-d');
    expect(within(hiRow).getByText('#333333')).toBeDefined();
  });

  it('renders DTCG dot-segment variants (hi.disabled) the same as hyphen tails', () => {
    const snap = makeSnapshot();
    snap.permutationsResolved['Light'] = {
      ...snap.permutationsResolved['Light'],
      'color.bg.hi': { $type: 'color', $value: { hex: '#111111' } },
      'color.bg.hi.disabled': { $type: 'color', $value: { hex: '#222222' } },
      'color.bg.hi.hover': { $type: 'color', $value: { hex: '#333333' } },
    };
    render(
      <SwatchbookProvider value={snap}>
        <ColorTable filter="color.bg.*" variants={{ hover: 'hover', disabled: 'disabled' }} />
      </SwatchbookProvider>,
    );

    const rows = screen.getAllByTestId('color-table-row');
    expect(rows.length).toBe(1);
    const pills = within(rows[0] as HTMLElement).getAllByTestId('color-table-variant');
    expect(pills.map((p) => p.textContent)).toEqual(['base', 'hover', 'disabled']);
  });

  it('ignores variants that would match characters inside a segment (neutral-900 ≠ suffix 0)', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="color.palette.*" variants={{ zero: '0' }} />
      </SwatchbookProvider>,
    );
    expect(screen.queryAllByTestId('color-table-variant').length).toBe(0);
  });
});

describe('ColorTable — expansion', () => {
  afterEach(() => {
    cleanup();
  });

  it('row click toggles inline expansion (no drawer)', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="color.text.default" />
      </SwatchbookProvider>,
    );
    expect(screen.queryByTestId('color-table-detail')).toBeNull();

    const row = screen.getByTestId('color-table-row');
    act(() => {
      fireEvent.click(row);
    });
    expect(screen.getByTestId('color-table-detail')).toBeDefined();
    expect(row.getAttribute('aria-label')).toBe('Collapse color.text.default');

    act(() => {
      fireEvent.click(row);
    });
    expect(screen.queryByTestId('color-table-detail')).toBeNull();
  });

  it('expansion surfaces $description and alias chain from the active variant', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="color.text.default" />
      </SwatchbookProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByTestId('color-table-row'));
    });
    const detail = screen.getByTestId('color-table-detail');
    expect(within(detail).getByText('Primary text on default surfaces.')).toBeDefined();
    expect(detail.textContent).toContain('color.palette.neutral.900');
  });

  it('multi-variant expansion lists all variants in a sub-table', () => {
    const snap = makeSnapshot();
    snap.permutationsResolved['Light'] = {
      ...snap.permutationsResolved['Light'],
      'color.bg.hi': { $type: 'color', $value: { hex: '#111111' } },
      'color.bg.hi-h': { $type: 'color', $value: { hex: '#222222' } },
      'color.bg.hi-d': { $type: 'color', $value: { hex: '#333333' } },
    };
    render(
      <SwatchbookProvider value={snap}>
        <ColorTable filter="color.bg.*" variants={{ hover: 'h', disabled: 'd' }} />
      </SwatchbookProvider>,
    );
    const row = screen
      .getAllByTestId('color-table-row')
      .find((r) => r.getAttribute('data-base') === 'color.bg.hi');
    if (!row) throw new Error('group row not found');
    act(() => {
      fireEvent.click(row);
    });
    const detail = screen.getByTestId('color-table-detail');
    expect(detail.textContent).toContain('#111111');
    expect(detail.textContent).toContain('#222222');
    expect(detail.textContent).toContain('#333333');
  });

  it('onSelect suppresses expansion and hands the active path to the consumer', () => {
    const picks: string[] = [];
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <ColorTable filter="color.text.default" onSelect={(p) => picks.push(p)} />
      </SwatchbookProvider>,
    );
    const row = screen.getByTestId('color-table-row');
    row.click();
    expect(picks).toEqual(['color.text.default']);
    expect(screen.queryByTestId('color-table-detail')).toBeNull();
  });

  it('clicking a pill does not toggle the row expansion', () => {
    const snap = makeSnapshot();
    snap.permutationsResolved['Light'] = {
      ...snap.permutationsResolved['Light'],
      'color.bg.hi': { $type: 'color', $value: { hex: '#111111' } },
      'color.bg.hi-h': { $type: 'color', $value: { hex: '#222222' } },
    };
    render(
      <SwatchbookProvider value={snap}>
        <ColorTable filter="color.bg.*" variants={{ hover: 'h' }} />
      </SwatchbookProvider>,
    );
    const row = screen
      .getAllByTestId('color-table-row')
      .find((r) => r.getAttribute('data-base') === 'color.bg.hi');
    if (!row) throw new Error('group row not found');
    const hoverPill = within(row)
      .getAllByTestId('color-table-variant')
      .find((p) => p.textContent === 'hover');
    if (!hoverPill) throw new Error('hover pill not found');
    hoverPill.click();

    expect(screen.queryByTestId('color-table-detail')).toBeNull();
  });
});
