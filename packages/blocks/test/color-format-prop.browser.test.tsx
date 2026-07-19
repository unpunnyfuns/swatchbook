import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ColorFormatContext, ColorTable, SwatchbookProvider, TokenDetail } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import { makeColorTableSnapshot } from './_color-table-helpers.tsx';
import { makeResolveAt } from './_snapshot-helpers.ts';

afterEach(() => {
  cleanup();
});

it('a colorFormat prop overrides the project default', () => {
  const snapshot = makeColorTableSnapshot();
  snapshot.defaultColorFormat = 'hex';
  render(
    <SwatchbookProvider value={snapshot}>
      <ColorTable filter="color.text.default" colorFormat="oklch" />
    </SwatchbookProvider>,
  );

  const row = screen.getByTestId('color-table-row');
  within(row).getByText(/^oklch\(/);
  expect(within(row).queryByText('#111111')).toBeNull();
});

it('a colorFormat prop overrides an outer ColorFormatContext', () => {
  const snapshot = makeColorTableSnapshot();
  snapshot.defaultColorFormat = 'hex';
  render(
    <SwatchbookProvider value={snapshot}>
      <ColorFormatContext.Provider value="rgb">
        <ColorTable filter="color.text.default" colorFormat="oklch" />
      </ColorFormatContext.Provider>
    </SwatchbookProvider>,
  );

  const row = screen.getByTestId('color-table-row');
  within(row).getByText(/^oklch\(/);
  expect(within(row).queryByText('#111111')).toBeNull();
});

function makeTokenDetailSnapshot(): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
    defaultColorFormat: 'hex',
  };
  snap.resolveAt = makeResolveAt({
    'color.brand.primary': { $type: 'color', $value: { hex: '#3b82f6' } },
  });
  return snap;
}

// TokenDetail is a COMPOSING block: it wraps its render tree in
// `<ColorFormatContext.Provider>` (only when `colorFormat` is set) so
// nested color-reading children inherit the override. TokenDetail's own
// top-line value is computed directly from the prop, not through
// context, so it can't tell a working wrap from a broken one.
// `AxisVariance` is a separately rendered child that reads
// `ColorFormatContext` for itself; its "constant" value cell only
// picks up the override if the wrap actually happened. This is the
// nested-propagation path with zero prior coverage.
it('a colorFormat prop on TokenDetail propagates into the nested AxisVariance', () => {
  render(
    <SwatchbookProvider value={makeTokenDetailSnapshot()}>
      <TokenDetail path="color.brand.primary" colorFormat="oklch" />
    </SwatchbookProvider>,
  );

  const cell = screen.getByTestId('token-detail-constant');
  within(cell).getByText(/^oklch\(/);
  expect(within(cell).queryByText('#3b82f6')).toBeNull();
});

it('without a colorFormat prop, TokenDetail leaves the nested AxisVariance on the project default', () => {
  render(
    <SwatchbookProvider value={makeTokenDetailSnapshot()}>
      <TokenDetail path="color.brand.primary" />
    </SwatchbookProvider>,
  );

  const cell = screen.getByTestId('token-detail-constant');
  within(cell).getByText('#3b82f6');
  expect(within(cell).queryByText(/^oklch\(/)).toBeNull();
});
