import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ColorPalette, SwatchbookProvider } from '#/index.ts';
import { makeColorTableSnapshot } from './_color-table-helpers.tsx';

const MyColorSwatch = () => <b data-testid="mine">mine</b>;

afterEach(() => cleanup());

it('a provider color override renders inside the built-in ColorPalette', () => {
  render(
    <SwatchbookProvider value={makeColorTableSnapshot()} presenters={{ color: MyColorSwatch }}>
      <ColorPalette filter="color.**" />
    </SwatchbookProvider>,
  );
  expect(screen.getAllByTestId('mine').length).toBeGreaterThan(0);
  expect(document.querySelector('.sb-color-swatch__chip')).toBeNull();
});
