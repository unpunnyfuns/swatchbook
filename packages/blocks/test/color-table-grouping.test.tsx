import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ColorTable, type ProjectSnapshot, SwatchbookProvider } from '#/index.ts';
import { makeColorTableSnapshot } from './_color-table-helpers.tsx';

function makeVariantSnapshot(): ProjectSnapshot {
  const base = makeColorTableSnapshot();
  base.permutationsResolved['Light'] = {
    ...base.permutationsResolved['Light'],
    'color.bg.hi': { $type: 'color', $value: { hex: '#111111' } },
    'color.bg.hi-h': { $type: 'color', $value: { hex: '#222222' } },
    'color.bg.hi-d': { $type: 'color', $value: { hex: '#333333' } },
  };
  return base;
}

describe('ColorTable — grouping', () => {
  afterEach(() => {
    cleanup();
  });

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
    const snap = makeColorTableSnapshot();
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
      <SwatchbookProvider value={makeColorTableSnapshot()}>
        <ColorTable filter="color.palette.*" variants={{ zero: '0' }} />
      </SwatchbookProvider>,
    );
    expect(screen.queryAllByTestId('color-table-variant').length).toBe(0);
  });
});
