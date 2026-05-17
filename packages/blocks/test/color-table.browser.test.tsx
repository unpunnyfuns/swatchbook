import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from '@vitest/browser/context';
import { ColorTable, SwatchbookProvider } from '#/index.ts';
import { makeColorTableSnapshot } from './_color-table-helpers.tsx';

describe('ColorTable — base rendering', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders only $type: color tokens (skips the dimension row)', () => {
    render(
      <SwatchbookProvider value={makeColorTableSnapshot()}>
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
      <SwatchbookProvider value={makeColorTableSnapshot()}>
        <ColorTable filter="color.text.default" />
      </SwatchbookProvider>,
    );

    const row = screen.getByTestId('color-table-row');
    within(row).getByText('#111111');
    within(row).getByText(/var\(--sb-color-text-default\)/);
    within(row).getByText('color.palette.neutral.900');
    // Per-format HSL / OKLCH copy buttons shouldn't exist on the collapsed row.
    expect(within(row).queryByLabelText(/Copy HSL/)).toBeNull();
    expect(within(row).queryByLabelText(/Copy OKLCH/)).toBeNull();
  });

  it('renders an em-dash in the alias column for non-aliased tokens', () => {
    render(
      <SwatchbookProvider value={makeColorTableSnapshot()}>
        <ColorTable filter="color.surface.*" />
      </SwatchbookProvider>,
    );
    const row = screen.getByTestId('color-table-row');
    const alias = row.querySelector('.sb-color-table__alias');
    expect(alias?.textContent?.trim()).toBe('—');
  });

  it('fuzzy search narrows rows with out-of-order terms', async () => {
    render(
      <SwatchbookProvider value={makeColorTableSnapshot()}>
        <ColorTable />
      </SwatchbookProvider>,
    );

    const input = screen.getByTestId('color-table-search') as HTMLInputElement;
    await userEvent.fill(input, 'default text');

    const rows = screen.getAllByTestId('color-table-row');
    expect(rows.length).toBe(1);
    expect(rows[0]?.getAttribute('data-path')).toBe('color.text.default');
  });

  it('renders the empty state when the filter matches no colors', () => {
    render(
      <SwatchbookProvider value={makeColorTableSnapshot()}>
        <ColorTable filter="typography.*" />
      </SwatchbookProvider>,
    );
    expect(screen.queryByRole('table')).toBeNull();
    screen.getByText('No color tokens match this filter.');
  });

  it('renders no variant pills when the variants prop is omitted', () => {
    render(
      <SwatchbookProvider value={makeColorTableSnapshot()}>
        <ColorTable />
      </SwatchbookProvider>,
    );
    expect(screen.queryAllByTestId('color-table-variant').length).toBe(0);
  });

  it('clicking a copy button does not bubble into the row click', () => {
    const picks: string[] = [];
    render(
      <SwatchbookProvider value={makeColorTableSnapshot()}>
        <ColorTable onSelect={(p) => picks.push(p)} filter="color.surface.*" />
      </SwatchbookProvider>,
    );
    const copy = screen.getAllByLabelText(/Copy value/)[0];
    copy?.click();
    expect(picks.length).toBe(0);
  });
});
