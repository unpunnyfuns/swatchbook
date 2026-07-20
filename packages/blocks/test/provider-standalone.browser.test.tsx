import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { SWATCHBOOK_STYLE_ELEMENT_ID } from '@unpunnyfuns/swatchbook-core/style-element';
import { ColorPalette, SwatchbookProvider, useSetAxes } from '#/index.ts';
import { makeWireSnapshot } from './_wire-helpers.ts';

afterEach(() => cleanup());

// The managed style element is shared and persists across tests in this
// file; start each CSS-mounting test from a clean slate.
function removeManagedStyleElement(): void {
  document.getElementById(SWATCHBOOK_STYLE_ELEMENT_ID)?.remove();
}

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

it('mounts the snapshot css into the managed style element by default', () => {
  removeManagedStyleElement();
  render(
    <SwatchbookProvider snapshot={makeWireSnapshot({ css: ':root { --sb-x: 1; }' })}>
      <span />
    </SwatchbookProvider>,
  );
  const style = document.getElementById(SWATCHBOOK_STYLE_ELEMENT_ID);
  expect(style).not.toBeNull();
  expect(style?.textContent).toBe(':root { --sb-x: 1; }');
});

it('mounts nothing when mountCss is false', () => {
  removeManagedStyleElement();
  render(
    <SwatchbookProvider
      snapshot={makeWireSnapshot({ css: ':root { --sb-x: 1; }' })}
      mountCss={false}
    >
      <span />
    </SwatchbookProvider>,
  );
  expect(document.getElementById(SWATCHBOOK_STYLE_ELEMENT_ID)).toBeNull();
});

it('updates the style element in place when a re-render changes the snapshot css', () => {
  removeManagedStyleElement();
  const { rerender } = render(
    <SwatchbookProvider snapshot={makeWireSnapshot({ css: ':root { --sb-x: 1; }' })}>
      <span />
    </SwatchbookProvider>,
  );
  rerender(
    <SwatchbookProvider snapshot={makeWireSnapshot({ css: ':root { --sb-x: 2; }' })}>
      <span />
    </SwatchbookProvider>,
  );
  expect(document.getElementById(SWATCHBOOK_STYLE_ELEMENT_ID)?.textContent).toBe(
    ':root { --sb-x: 2; }',
  );
});
