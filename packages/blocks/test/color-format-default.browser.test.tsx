import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ColorTable, SwatchbookProvider } from '#/index.ts';
import { makeColorTableSnapshot } from './_color-table-helpers.tsx';

afterEach(() => {
  cleanup();
});

it('defaults the color format to the snapshot defaultColorFormat when no context/prop override is set', () => {
  const snapshot = makeColorTableSnapshot();
  snapshot.defaultColorFormat = 'oklch';
  render(
    <SwatchbookProvider value={snapshot}>
      <ColorTable filter="color.text.default" />
    </SwatchbookProvider>,
  );

  const row = screen.getByTestId('color-table-row');
  within(row).getByText(/^oklch\(/);
  expect(within(row).queryByText('#111111')).toBeNull();
});
