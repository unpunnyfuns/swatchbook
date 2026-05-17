import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ColorTable, SwatchbookProvider } from '#/index.ts';
import { makeColorTableSnapshot } from './_color-table-helpers.tsx';
import { withCellsShape } from './_snapshot-utils.ts';

describe('ColorTable — expansion', () => {
  afterEach(() => {
    cleanup();
  });

  it('row click toggles inline expansion (no drawer)', () => {
    render(
      <SwatchbookProvider value={makeColorTableSnapshot()}>
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
      <SwatchbookProvider value={makeColorTableSnapshot()}>
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
    const snap = makeColorTableSnapshot();
    snap.permutationsResolved['Light'] = {
      ...snap.permutationsResolved['Light'],
      'color.bg.hi': { $type: 'color', $value: { hex: '#111111' } },
      'color.bg.hi-h': { $type: 'color', $value: { hex: '#222222' } },
      'color.bg.hi-d': { $type: 'color', $value: { hex: '#333333' } },
    };
    render(
      <SwatchbookProvider value={withCellsShape(snap)}>
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
      <SwatchbookProvider value={makeColorTableSnapshot()}>
        <ColorTable filter="color.text.default" onSelect={(p) => picks.push(p)} />
      </SwatchbookProvider>,
    );
    const row = screen.getByTestId('color-table-row');
    row.click();
    expect(picks).toEqual(['color.text.default']);
    expect(screen.queryByTestId('color-table-detail')).toBeNull();
  });

  it('clicking a pill does not toggle the row expansion', () => {
    const snap = makeColorTableSnapshot();
    snap.permutationsResolved['Light'] = {
      ...snap.permutationsResolved['Light'],
      'color.bg.hi': { $type: 'color', $value: { hex: '#111111' } },
      'color.bg.hi-h': { $type: 'color', $value: { hex: '#222222' } },
    };
    render(
      <SwatchbookProvider value={withCellsShape(snap)}>
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
