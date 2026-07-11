/**
 * Integration tests for RowIndicators mounted inside LeafRow.
 *
 * Covers two concerns:
 * 1. Clicking a forward chain node navigates the tree — expands ancestor
 *    groups and reveals the target leaf. The fixture nests the target two
 *    levels deep under a prefix the alias chain points to, so it starts
 *    collapsed and the navigation genuinely has work to do.
 * 2. A deprecated token's leaf-row div carries `data-deprecated="true"`.
 */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider, TokenNavigator } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import type { VirtualTokenShape } from '#/contexts.ts';

// `color.text.primary` aliases `color.palette.blue.500`. With no `root` set,
// both live in the tree; `color.palette.blue.500` sits a level below the
// initial expanded depth, so it starts collapsed and the forward-chain click
// has genuine expand work to do.
const TOKENS: Record<string, VirtualTokenShape> = {
  'color.text.primary': {
    $type: 'color',
    $value: { hex: '#0000ff' },
    aliasChain: ['color.palette.blue.500'],
  },
  'color.palette.blue.500': {
    $type: 'color',
    $value: { hex: '#0000ff' },
    aliasedBy: ['color.text.primary'],
  },
};

function snapshot(): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = () => TOKENS;
  return snap;
}

afterEach(cleanup);

it('clicking a forward chain node navigates the tree to that token', async () => {
  // No `root` restriction so both tokens appear. `initiallyExpanded={2}`
  // expands `color` and its child groups (`text`, `palette`) but NOT the
  // level-3 `color.palette.blue` group — so `color.palette.blue.500` starts
  // hidden while `color.text.primary` (and its forward-chain indicator) is
  // visible. Clicking the forward node must expand the ancestors and reveal it.
  render(
    <SwatchbookProvider value={snapshot()}>
      <TokenNavigator searchable={false} initiallyExpanded={2} />
    </SwatchbookProvider>,
  );

  // Wait for the forward-chain indicator on color.text.primary to appear.
  const forward = await screen.findByTestId('row-indicator-alias-forward');
  const node = within(forward).getAllByTestId('alias-node')[0] as HTMLElement;

  // The alias-node should be a clickable button (resolveInView returns true
  // because color.palette.blue.500 is present in resolved with no type filter).
  expect(node.tagName.toLowerCase()).toBe('button');

  // Target starts hidden — its `color.palette.blue` ancestor is collapsed.
  // This is what makes the click below a genuine expand-and-reveal, not a no-op.
  expect(
    screen
      .queryAllByTestId('token-navigator-leaf')
      .find((el) => el.getAttribute('data-path') === 'color.palette.blue.500'),
  ).toBeUndefined();

  await userEvent.click(node);

  // After navigation the target leaf must be present in the tree.
  await waitFor(() => {
    const leaves = screen.getAllByTestId('token-navigator-leaf');
    const target = leaves.find((el) => el.getAttribute('data-path') === 'color.palette.blue.500');
    expect(target).toBeTruthy();
  });
});

it('applies a strikethrough flag to a deprecated row', async () => {
  const deprecated: Record<string, VirtualTokenShape> = {
    'color.old': { $type: 'color', $value: { hex: '#f00' }, $deprecated: 'use color.new' },
  };
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = () => deprecated;
  render(
    <SwatchbookProvider value={snap}>
      <TokenNavigator searchable={false} />
    </SwatchbookProvider>,
  );
  const row = await screen.findByTestId('token-navigator-leaf-row');
  expect(row.getAttribute('data-deprecated')).toBe('true');
});
