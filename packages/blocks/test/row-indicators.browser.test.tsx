import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import type { AxisVarianceResult } from '@unpunnyfuns/swatchbook-core';
import type { VirtualTokenShape } from '#/contexts.ts';
import { RowIndicators } from '#/indicators/RowIndicators.tsx';
import { resolveIndicators } from '#/indicators/resolve.ts';

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
      canReference={inView}
      onReferenceClick={noop}
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

function renderVariance(variance: AxisVarianceResult) {
  return render(
    <RowIndicators
      path="t"
      token={{ $type: 'color', $value: { hex: '#00f' } }}
      root={undefined}
      variance={variance}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
    />,
  );
}

it('single-axis variance shows the axis name', () => {
  renderVariance({
    path: 't',
    kind: 'single',
    axis: 'mode',
    varyingAxes: ['mode'],
    constantAcrossAxes: [],
    perAxis: {},
  });
  const badge = screen.getByTestId('row-indicator-variance');
  expect(badge.textContent).toContain('mode');
});

it('multi-axis variance shows the count with axes in aria-label', () => {
  renderVariance({
    path: 't',
    kind: 'multi',
    varyingAxes: ['mode', 'contrast'],
    constantAcrossAxes: [],
    perAxis: {},
  });
  const badge = screen.getByTestId('row-indicator-variance');
  expect(badge.textContent).toContain('2');
  expect(badge).toHaveAttribute('aria-label', expect.stringContaining('mode'));
  expect(badge).toHaveAttribute('aria-label', expect.stringContaining('contrast'));
});

it('constant variance shows no badge', () => {
  renderVariance({
    path: 't',
    kind: 'constant',
    varyingAxes: [],
    constantAcrossAxes: ['mode'],
    perAxis: {},
  });
  expect(screen.queryByTestId('row-indicator-variance')).toBeNull();
});

it('flags an out-of-gamut color for the active format', () => {
  render(
    <RowIndicators
      path="c"
      token={{
        $type: 'color',
        $value: { colorSpace: 'display-p3', components: [1, 0, 0], alpha: 1 },
      }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
    />,
  );
  expect(screen.getByLabelText('out of gamut')).toBeTruthy();
});

it('shows no gamut warning for an in-gamut color', () => {
  render(
    <RowIndicators
      path="c"
      token={{ $type: 'color', $value: { hex: '#00ff00' } }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
    />,
  );
  expect(screen.queryByLabelText('out of gamut')).toBeNull();
});

it('shows a deprecation badge with the message in aria-label', () => {
  render(
    <RowIndicators
      path="d"
      token={{ $type: 'color', $value: { hex: '#000' }, $deprecated: 'use color.new' }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
    />,
  );
  const badge = screen.getByTestId('row-indicator-deprecated');
  expect(badge).toHaveAttribute('aria-label', expect.stringContaining('use color.new'));
});

it('shows a deprecation badge for the boolean flag form', () => {
  render(
    <RowIndicators
      path="d"
      token={{ $type: 'color', $value: { hex: '#000' }, $deprecated: true }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
    />,
  );
  expect(screen.getByTestId('row-indicator-deprecated')).toHaveAttribute(
    'aria-label',
    'deprecated',
  );
});

it('shows no deprecation badge when not deprecated', () => {
  render(
    <RowIndicators
      path="d"
      token={{ $type: 'color', $value: { hex: '#000' } }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
    />,
  );
  expect(screen.queryByTestId('row-indicator-deprecated')).toBeNull();
});

it('reverse count of 1 navigates directly on click', async () => {
  const onReferenceClick = vi.fn();
  render(
    <RowIndicators
      path="t"
      token={{ $type: 'color', $value: { hex: '#00f' }, aliasedBy: ['color.brand'] }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={onReferenceClick}
    />,
  );
  await userEvent.click(screen.getByTestId('row-indicator-alias-reverse'));
  expect(onReferenceClick).toHaveBeenCalledWith('color.brand');
});

it('reverse count > 1 opens a popover whose items navigate', async () => {
  const onReferenceClick = vi.fn();
  render(
    <RowIndicators
      path="t"
      token={{
        $type: 'color',
        $value: { hex: '#00f' },
        aliasedBy: ['color.brand', 'color.text.primary'],
      }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={onReferenceClick}
    />,
  );
  await userEvent.click(screen.getByTestId('row-indicator-alias-reverse'));
  const item = await screen.findByRole('menuitem', { name: 'color.text.primary' });
  await userEvent.click(item);
  expect(onReferenceClick).toHaveBeenCalledWith('color.text.primary');
});

it('renders an off-view forward node as plain non-clickable text', async () => {
  const onReferenceClick = vi.fn();
  render(
    <RowIndicators
      path="t"
      token={{ $type: 'color', $value: { hex: '#00f' }, aliasChain: ['color.hidden'] }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={() => false}
      onReferenceClick={onReferenceClick}
    />,
  );
  const node = screen.getByTestId('alias-node');
  expect(node.tagName.toLowerCase()).not.toBe('button');
  expect(node).toHaveAttribute('title', 'outside current view');
  await userEvent.click(node);
  expect(onReferenceClick).not.toHaveBeenCalled();
});

it('closes the reverse popover on Escape from within the menu', async () => {
  render(
    <RowIndicators
      path="t"
      token={{ $type: 'color', $value: { hex: '#00f' }, aliasedBy: ['color.a', 'color.b'] }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={() => true}
      onReferenceClick={() => {}}
    />,
  );
  await userEvent.click(screen.getByTestId('row-indicator-alias-reverse'));
  const menuItem = await screen.findByRole('menuitem', { name: 'color.a' });
  expect(menuItem).toBeTruthy();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    expect(screen.queryByRole('menuitem', { name: 'color.a' })).toBeNull();
  });
});

it('moves focus into the menu on open (first enabled item)', async () => {
  render(
    <RowIndicators
      path="t"
      token={{ $type: 'color', $value: { hex: '#00f' }, aliasedBy: ['color.a', 'color.b'] }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={() => true}
      onReferenceClick={() => {}}
    />,
  );
  await userEvent.click(screen.getByTestId('row-indicator-alias-reverse'));
  const menuItem = await screen.findByRole('menuitem', { name: 'color.a' });
  await waitFor(() => expect(document.activeElement).toBe(menuItem));
});

it('closes the reverse popover on outside pointerdown', async () => {
  render(
    <div>
      <button type="button" data-testid="outside">
        outside
      </button>
      <RowIndicators
        path="t"
        token={{ $type: 'color', $value: { hex: '#00f' }, aliasedBy: ['color.a', 'color.b'] }}
        root={undefined}
        variance={undefined}
        colorFormat="hex"
        canReference={() => true}
        onReferenceClick={() => {}}
      />
    </div>,
  );
  await userEvent.click(screen.getByTestId('row-indicator-alias-reverse'));
  await screen.findByRole('menuitem', { name: 'color.a' });
  await userEvent.click(screen.getByTestId('outside'));
  await waitFor(() => {
    expect(screen.queryByRole('menuitem', { name: 'color.a' })).toBeNull();
  });
});

it('renders a description glyph when description is enabled and present', () => {
  render(
    <RowIndicators
      path="d"
      token={{ $type: 'color', $value: { hex: '#000' }, $description: 'Brand primary' }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
      enabled={resolveIndicators({ description: true })}
    />,
  );
  const badge = screen.getByTestId('row-indicator-description');
  expect(badge).toHaveAttribute('aria-label', expect.stringContaining('Brand primary'));
});

it('omits the description glyph when description is not enabled (default)', () => {
  render(
    <RowIndicators
      path="d"
      token={{ $type: 'color', $value: { hex: '#000' }, $description: 'Brand primary' }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
    />,
  );
  expect(screen.queryByTestId('row-indicator-description')).toBeNull();
});

it('omits the description glyph when enabled but the token has no description', () => {
  render(
    <RowIndicators
      path="d"
      token={{ $type: 'color', $value: { hex: '#000' } }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
      enabled={resolveIndicators({ description: true })}
    />,
  );
  expect(screen.queryByTestId('row-indicator-description')).toBeNull();
});

it('hides an indicator when disabled via enabled', () => {
  render(
    <RowIndicators
      path="d"
      token={{ $type: 'color', $value: { hex: '#000' }, $deprecated: 'old' }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
      enabled={resolveIndicators({ deprecation: false })}
    />,
  );
  expect(screen.queryByTestId('row-indicator-deprecated')).toBeNull();
});

it('renders nothing when every present indicator is disabled', () => {
  render(
    <RowIndicators
      path="d"
      token={{ $type: 'color', $value: { hex: '#000' }, aliasChain: ['x'], $deprecated: true }}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
      enabled={resolveIndicators(false)}
    />,
  );
  expect(screen.queryByTestId('row-indicator-alias-forward')).toBeNull();
  expect(screen.queryByTestId('row-indicator-deprecated')).toBeNull();
});

function renderEnabled(
  path: string,
  token: VirtualTokenShape,
  enabled: ReturnType<typeof resolveIndicators>,
) {
  return render(
    <RowIndicators
      path={path}
      token={token}
      root={undefined}
      variance={undefined}
      colorFormat="hex"
      canReference={inView}
      onReferenceClick={noop}
      enabled={enabled}
    />,
  );
}

it('shows a composes count for a composite object value when enabled', () => {
  renderEnabled(
    'typography.body',
    {
      $type: 'typography',
      $value: {
        fontFamily: 'Inter',
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0',
      },
    },
    resolveIndicators({ composes: true }),
  );
  expect(screen.getByTestId('row-indicator-composes').textContent).toContain('5');
});

it('counts gradient stops as the composes total', () => {
  renderEnabled(
    'gradient.brand',
    { $type: 'gradient', $value: [{ color: '#000' }, { color: '#fff' }, { color: '#f00' }] },
    resolveIndicators({ composes: true }),
  );
  expect(screen.getByTestId('row-indicator-composes').textContent).toContain('3');
});

it('off by default: no composes badge even for a composite token', () => {
  renderRow('typography.body', {
    $type: 'typography',
    $value: { fontFamily: 'Inter', fontSize: '1rem' },
  });
  expect(screen.queryByTestId('row-indicator-composes')).toBeNull();
});

it('never badges a non-composite object value such as a color', () => {
  renderEnabled(
    'color.brand',
    { $type: 'color', $value: { hex: '#00f' } },
    resolveIndicators({ composes: true }),
  );
  expect(screen.queryByTestId('row-indicator-composes')).toBeNull();
});

it('no composes badge for an aliased composite whose value is a string', () => {
  renderEnabled(
    'typography.alias',
    { $type: 'typography', $value: '{typography.body}' },
    resolveIndicators({ composes: true }),
  );
  expect(screen.queryByTestId('row-indicator-composes')).toBeNull();
});
