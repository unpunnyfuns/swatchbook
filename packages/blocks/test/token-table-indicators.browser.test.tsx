import { cleanup, render, screen, within } from '@testing-library/react';
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider, TokenTable } from '#/index.ts';
import type { ProjectSnapshot, VirtualTokenShape } from '#/index.ts';
import { makeResolveAt } from './_snapshot-helpers.ts';

const TOKENS: Record<string, VirtualTokenShape> = {
  'color.primary': {
    $type: 'color',
    $value: { hex: '#0000ff' },
    aliasChain: ['color.palette.blue.500'],
  },
  'color.palette.blue.500': {
    $type: 'color',
    $value: { hex: '#0000ff' },
    aliasedBy: ['color.primary'],
  },
  'color.legacy': {
    $type: 'color',
    $value: { hex: '#ff0000' },
    $deprecated: 'use color.primary',
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
  snap.resolveAt = makeResolveAt(TOKENS);
  return snap;
}

afterEach(cleanup);

function rowFor(path: string) {
  return screen
    .getAllByTestId('token-table-row')
    .find((el) => el.getAttribute('data-path') === path)!;
}

it('renders the alias chain indicator in the table', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <TokenTable type="color" />
    </SwatchbookProvider>,
  );
  expect(within(rowFor('color.primary')).getByTestId('row-indicator-alias-forward')).toBeTruthy();
});

it("clicking an alias node opens that token's detail overlay", async () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <TokenTable type="color" />
    </SwatchbookProvider>,
  );
  const fwd = within(rowFor('color.primary')).getByTestId('row-indicator-alias-forward');
  const node = within(fwd).getAllByTestId('alias-node')[0] as HTMLElement;
  await userEvent.click(node);
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getAllByText(/color\.palette\.blue\.500/).length).toBeGreaterThan(0);
});

it("strikes through a deprecated row's path cell", () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <TokenTable type="color" />
    </SwatchbookProvider>,
  );
  const pathCell = within(rowFor('color.legacy')).getByText('color.legacy').closest('td')!;
  expect(pathCell.getAttribute('data-deprecated')).toBe('true');
});
