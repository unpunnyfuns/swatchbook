import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider, ColorTable } from '#/index.ts';
import type { ProjectSnapshot, VirtualToken } from '#/index.ts';

const TOKENS: Record<string, VirtualToken> = {
  'color.primary': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1 },
    aliasChain: ['color.palette.blue.500'],
  },
  'color.palette.blue.500': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1 },
    aliasedBy: ['color.primary'],
  },
  'color.legacy': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 },
    $deprecated: 'use color.primary',
  },
  'color.wide': {
    $type: 'color',
    $value: { colorSpace: 'display-p3', components: [1, 0, 0], alpha: 1 },
  },
};

function snapshot(): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    axes: [],
    defaultTuple: {},
    activeTheme: 'default',
    activeAxes: {},
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = () => TOKENS;
  return snap;
}

afterEach(cleanup);

function rowFor(path: string) {
  return screen
    .getAllByTestId('color-table-row')
    .find((el) => el.getAttribute('data-path') === path)!;
}

it('renders the alias chain indicator in a ColorTable row', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <ColorTable />
    </SwatchbookProvider>,
  );
  expect(within(rowFor('color.primary')).getByTestId('row-indicator-alias-forward')).toBeTruthy();
});

it('alias refs are informational (plain text, not buttons)', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <ColorTable />
    </SwatchbookProvider>,
  );
  const fwd = within(rowFor('color.primary')).getByTestId('row-indicator-alias-forward');
  const node = within(fwd).getAllByTestId('alias-node')[0] as HTMLElement;
  expect(node.tagName.toLowerCase()).not.toBe('button');
});

it('keeps the value-cell gamut warning and shows no gamut badge in the strip', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <ColorTable />
    </SwatchbookProvider>,
  );
  const row = rowFor('color.wide');
  expect(within(row).getByLabelText('out of gamut')).toBeTruthy();
  expect(within(row).getAllByLabelText('out of gamut').length).toBe(1);
});

it('hides the strip when indicators={false}', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <ColorTable indicators={false} />
    </SwatchbookProvider>,
  );
  expect(screen.queryByTestId('row-indicator-deprecated')).toBeNull();
  expect(screen.queryByTestId('row-indicator-alias-forward')).toBeNull();
});

it("strikes through a deprecated color row's name cell", () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <ColorTable />
    </SwatchbookProvider>,
  );
  const nameCell = within(rowFor('color.legacy')).getByText('color.legacy').closest('td')!;
  expect(nameCell.getAttribute('data-deprecated')).toBe('true');
});

it('drops the name strikethrough when deprecation is disabled', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <ColorTable indicators={{ deprecation: false }} />
    </SwatchbookProvider>,
  );
  const nameCell = within(rowFor('color.legacy')).getByText('color.legacy').closest('td')!;
  expect(nameCell.getAttribute('data-deprecated')).toBeNull();
});
