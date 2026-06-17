import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { VirtualTokenShape } from '#/contexts.ts';
import { RowIndicators } from '#/token-navigator/RowIndicators.tsx';

afterEach(cleanup);

const noop = () => {};
const inView = () => true;

function renderRow(path: string, token: VirtualTokenShape, root?: string) {
  return render(
    <RowIndicators
      path={path}
      token={token}
      root={root}
      variance={undefined}
      colorFormat="hex"
      resolveInView={inView}
      onNavigate={noop}
    />,
  );
}

it('renders the full forward chain with relative labels and arrows', () => {
  renderRow(
    'color.text.primary',
    {
      $type: 'color',
      $value: { hex: '#00f' },
      aliasChain: ['color.brand', 'color.palette.blue.500'],
    },
    'color',
  );
  const chain = screen.getByTestId('row-indicator-alias-forward');
  const nodes = within(chain).getAllByTestId('alias-node');
  expect(nodes.map((n) => n.textContent)).toEqual(['brand', 'palette.blue.500']);
  expect(chain.textContent).toContain('→');
});

it('caps chains longer than two hops to first … last with full chain in aria-label', () => {
  renderRow('a', { $type: 'color', $value: { hex: '#00f' }, aliasChain: ['b', 'c', 'd'] });
  const chain = screen.getByTestId('row-indicator-alias-forward');
  const nodes = within(chain).getAllByTestId('alias-node');
  expect(nodes.map((n) => n.textContent)).toEqual(['b', 'd']);
  expect(chain.textContent).toContain('…');
  expect(chain).toHaveAttribute('aria-label', expect.stringContaining('b → c → d'));
});

it('renders nothing forward for a primitive', () => {
  renderRow('color.blue', { $type: 'color', $value: { hex: '#00f' } });
  expect(screen.queryByTestId('row-indicator-alias-forward')).toBeNull();
});

it('renders a reverse count from aliasedBy length', () => {
  renderRow('color.blue.500', {
    $type: 'color',
    $value: { hex: '#00f' },
    aliasedBy: ['color.brand', 'color.text.primary'],
  });
  const rev = screen.getByTestId('row-indicator-alias-reverse');
  expect(rev.textContent).toContain('2');
  expect(rev).toHaveAttribute('aria-label', expect.stringContaining('referenced by 2'));
});

it('renders both indicators for a mid-chain token', () => {
  renderRow('color.brand', {
    $type: 'color',
    $value: { hex: '#00f' },
    aliasChain: ['color.blue.500'],
    aliasedBy: ['color.text.primary'],
  });
  expect(screen.getByTestId('row-indicator-alias-forward')).toBeTruthy();
  expect(screen.getByTestId('row-indicator-alias-reverse')).toBeTruthy();
});

it('renders no reverse count when nothing references the token', () => {
  renderRow('color.blue', { $type: 'color', $value: { hex: '#00f' } });
  expect(screen.queryByTestId('row-indicator-alias-reverse')).toBeNull();
});
