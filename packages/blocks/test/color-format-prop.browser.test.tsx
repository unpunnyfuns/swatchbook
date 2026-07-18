import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ColorFormatContext, ColorTable, SwatchbookProvider } from '#/index.ts';
import { makeColorTableSnapshot } from './_color-table-helpers.tsx';

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
