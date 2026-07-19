import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ColorTable, SwatchbookContext } from '#/index.ts';
import { makeColorTableSnapshot } from './_color-table-helpers.tsx';

describe('ColorTable — base rendering', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders only $type: color tokens (skips the dimension row)', () => {
    render(
      <SwatchbookContext.Provider value={makeColorTableSnapshot()}>
        <ColorTable />
      </SwatchbookContext.Provider>,
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
      <SwatchbookContext.Provider value={makeColorTableSnapshot()}>
        <ColorTable filter="color.text.default" />
      </SwatchbookContext.Provider>,
    );

    const row = screen.getByTestId('color-table-row');
    within(row).getByText('#111111');
    within(row).getByText(/var\(--sb-color-text-default\)/);
    within(row).getByText('color.palette.neutral.900');
    // Per-format HSL / OKLCH copy buttons shouldn't exist on the collapsed row.
    expect(within(row).queryByLabelText(/Copy HSL/)).toBeNull();
    expect(within(row).queryByLabelText(/Copy OKLCH/)).toBeNull();
  });

  it('renders no indicator strip for tokens with no alias, variance, or deprecation', () => {
    render(
      <SwatchbookContext.Provider value={makeColorTableSnapshot()}>
        <ColorTable filter="color.surface.**" />
      </SwatchbookContext.Provider>,
    );
    const row = screen.getByTestId('color-table-row');
    expect(row.querySelector('.sb-indicator__indicators')).toBeNull();
  });

  it('fuzzy search narrows rows with out-of-order terms', async () => {
    render(
      <SwatchbookContext.Provider value={makeColorTableSnapshot()}>
        <ColorTable />
      </SwatchbookContext.Provider>,
    );

    const input = screen.getByTestId('color-table-search') as HTMLInputElement;
    await userEvent.fill(input, 'default text');

    // Filter is deferred via `useDeferredValue`; wait for the narrow
    // commit before asserting on the row set.
    await waitFor(() => {
      const rows = screen.getAllByTestId('color-table-row');
      expect(rows.length).toBe(1);
      expect(rows[0]?.getAttribute('data-path')).toBe('color.text.default');
    });
  });

  it('renders the empty state when the filter matches no colors', () => {
    render(
      <SwatchbookContext.Provider value={makeColorTableSnapshot()}>
        <ColorTable filter="typography.**" />
      </SwatchbookContext.Provider>,
    );
    expect(screen.queryByRole('table')).toBeNull();
    screen.getByText('No color tokens match this filter.');
  });

  it('renders no variant pills when the variants prop is omitted', () => {
    render(
      <SwatchbookContext.Provider value={makeColorTableSnapshot()}>
        <ColorTable />
      </SwatchbookContext.Provider>,
    );
    expect(screen.queryAllByTestId('color-table-variant').length).toBe(0);
  });

  it('clicking a copy button does not bubble into the row click', () => {
    const picks: string[] = [];
    render(
      <SwatchbookContext.Provider value={makeColorTableSnapshot()}>
        <ColorTable onSelect={(p) => picks.push(p)} filter="color.surface.**" />
      </SwatchbookContext.Provider>,
    );
    const copy = screen.getAllByLabelText(/Copy value/)[0];
    copy?.click();
    expect(picks.length).toBe(0);
  });
});
