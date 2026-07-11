import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider, TokenTable } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import { makeResolveAt } from './_snapshot-helpers.ts';

function bigSnapshot(count: number): ProjectSnapshot {
  const tokens: Record<string, { $type: string; $value: { hex: string } }> = {};
  for (let i = 0; i < count; i++) {
    tokens[`color.gen.p${i}`] = { $type: 'color', $value: { hex: '#3b82f6' } };
  }
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = makeResolveAt(tokens);
  return snap;
}

afterEach(() => cleanup());

it('mounts only a bounded window of rows for a large table', async () => {
  render(
    <SwatchbookProvider value={bigSnapshot(1000)}>
      <TokenTable searchable={false} />
    </SwatchbookProvider>,
  );
  await screen.findAllByTestId('token-table-row');
  const mounted = screen.getAllByTestId('token-table-row').length;
  expect(mounted).toBeGreaterThan(0);
  expect(mounted).toBeLessThan(60);
});

it('reveals later rows on scroll and unmounts earlier ones', async () => {
  render(
    <SwatchbookProvider value={bigSnapshot(1000)}>
      <TokenTable searchable={false} />
    </SwatchbookProvider>,
  );
  await screen.findAllByTestId('token-table-row');
  expect(screen.queryByText('color.gen.p0')).not.toBeNull();
  window.scrollTo(0, 20000);
  window.dispatchEvent(new Event('scroll'));
  await new Promise((r) => setTimeout(r, 100));
  const paths = screen.getAllByTestId('token-table-row').map((el) => el.getAttribute('data-path'));
  expect(paths).not.toContain('color.gen.p0');
  expect(paths.length).toBeGreaterThan(0);
});

it('renders every row and no spacer for a small table', async () => {
  render(
    <SwatchbookProvider value={bigSnapshot(20)}>
      <TokenTable searchable={false} />
    </SwatchbookProvider>,
  );
  await screen.findAllByTestId('token-table-row');
  expect(screen.getAllByTestId('token-table-row').length).toBe(20);
  expect(document.querySelector('tr[aria-hidden="true"]')).toBeNull();
  const table = screen.getByRole('table');
  expect(table.getAttribute('aria-rowcount')).toBe('21');
  expect(screen.getAllByTestId('token-table-row')[0]?.getAttribute('aria-rowindex')).toBe('2');
});

it('exposes the full row count and true row indices despite windowing', async () => {
  render(
    <SwatchbookProvider value={bigSnapshot(1000)}>
      <TokenTable searchable={false} />
    </SwatchbookProvider>,
  );
  const table = await screen.findByRole('table');
  expect(table.getAttribute('aria-rowcount')).toBe('1001');
  const firstRow = screen.getAllByTestId('token-table-row')[0];
  expect(firstRow?.getAttribute('aria-rowindex')).toBe('2');
});

it('can reach and mount the final row when scrolled to the bottom', async () => {
  render(
    <SwatchbookProvider value={bigSnapshot(1000)}>
      <TokenTable searchable={false} />
    </SwatchbookProvider>,
  );
  await screen.findAllByTestId('token-table-row');
  window.scrollTo(0, document.body.scrollHeight);
  window.dispatchEvent(new Event('scroll'));
  await new Promise((r) => setTimeout(r, 150));
  const paths = screen.getAllByTestId('token-table-row').map((el) => el.getAttribute('data-path'));
  expect(paths).toContain('color.gen.p999');
});
