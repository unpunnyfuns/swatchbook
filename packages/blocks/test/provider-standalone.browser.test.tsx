import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ColorPalette, SwatchbookProvider, useSetAxes } from '#/index.ts';
import { makeWireSnapshot } from './_wire-helpers.ts';

afterEach(() => cleanup());

it('renders resolved tokens from a wire snapshot with no addon or channel', () => {
  render(
    <SwatchbookProvider snapshot={makeWireSnapshot()} defaultAxes={{ mode: 'Light' }}>
      <ColorPalette filter="color.**" />
    </SwatchbookProvider>,
  );
  // the palette resolves at least one swatch from the wire tokenGraph
  expect(document.querySelectorAll('.sb-color-swatch__chip').length).toBeGreaterThan(0);
});

it('a controlled provider keeps the axes prop over a conflicting defaultAxes and rejects useSetAxes', () => {
  function Probe() {
    expect(() => useSetAxes()).toThrow(/uncontrolled/);
    return null;
  }
  render(
    <SwatchbookProvider
      snapshot={makeWireSnapshot()}
      axes={{ mode: 'Light' }}
      defaultAxes={{ mode: 'Dark' }}
    >
      <Probe />
    </SwatchbookProvider>,
  );
  expect(document.querySelector('[data-sb-mode="Light"]')).not.toBeNull();
});

it('an uncontrolled provider flips its tuple through useSetAxes', async () => {
  function Toggle() {
    const setAxes = useSetAxes();
    return (
      <button type="button" onClick={() => setAxes({ mode: 'Dark' })}>
        flip
      </button>
    );
  }
  render(
    <SwatchbookProvider snapshot={makeWireSnapshot()} defaultAxes={{ mode: 'Light' }}>
      <Toggle />
    </SwatchbookProvider>,
  );
  await userEvent.click(screen.getByRole('button'));
  expect(document.querySelector('[data-sb-mode="Dark"]')).not.toBeNull();
});
