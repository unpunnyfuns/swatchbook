import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DimensionBar, DimensionScale, SwatchbookProvider } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import { makeResolveAt } from './_snapshot-helpers.ts';

// A 25rem token sits at 400px under a 16px root (below the 480 cap) and 500px
// under a 20px root (above it). Whether it caps proves the cap math reads the
// real rendering-context root font-size instead of a hardcoded 16.
function makeSnapshot(): ProjectSnapshot {
  const tokens = {
    'dimension.wide': { $type: 'dimension', $value: { value: 25, unit: 'rem' } },
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
  snap.resolveAt = makeResolveAt(tokens);
  return snap;
}

afterEach(() => {
  cleanup();
  document.documentElement.style.fontSize = '';
});

it('does not cap a 25rem token at a 16px root (400px is under the 480 cap)', () => {
  document.documentElement.style.fontSize = '16px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionScale />
    </SwatchbookProvider>,
  );
  expect(container.querySelector('.sb-dimension-bar__cap')).toBeNull();
});

it('caps the same 25rem token when the root font-size is 20px (500px exceeds 480)', () => {
  document.documentElement.style.fontSize = '20px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionScale />
    </SwatchbookProvider>,
  );
  expect(container.querySelector('.sb-dimension-bar--capped')?.getAttribute('title')).toContain(
    'capped at 480px',
  );
  expect(container.querySelector('.sb-dimension-bar__cap')).not.toBeNull();
  const bar = container.querySelector<HTMLElement>('.sb-dimension-scale__visual-cell div');
  expect(bar?.style.width).toBe('480px');
});

it('re-evaluates the cap when a responsive breakpoint changes the root font-size', async () => {
  document.documentElement.style.fontSize = '16px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionScale />
    </SwatchbookProvider>,
  );
  expect(container.querySelector('.sb-dimension-bar__cap')).toBeNull();

  // A media query bumps the root at a breakpoint: 25rem is now 600px (> 480).
  document.documentElement.style.fontSize = '24px';
  window.dispatchEvent(new Event('resize'));

  await waitFor(() => {
    expect(container.querySelector('.sb-dimension-bar__cap')).not.toBeNull();
  });
});

// The cap indicator now lives in DimensionBar, so every consumer surfaces it
// the same way — including TokenNavigator, which previously clamped the bar
// silently. Rendering DimensionBar directly locks the shared behavior.
it('DimensionBar surfaces the cap marker for an oversized length token', () => {
  document.documentElement.style.fontSize = '20px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionBar path="dimension.wide" visual="length" />
    </SwatchbookProvider>,
  );
  const wrap = container.querySelector('.sb-dimension-bar--capped');
  expect(wrap?.getAttribute('title')).toContain('capped at 480px');
  expect(container.querySelector('.sb-dimension-bar__cap')).not.toBeNull();
  const bar = wrap?.querySelector<HTMLElement>('div');
  expect(bar?.style.width).toBe('480px');
});

it('DimensionBar renders a bare bar (no cap marker) when under the cap', () => {
  document.documentElement.style.fontSize = '16px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionBar path="dimension.wide" visual="length" />
    </SwatchbookProvider>,
  );
  expect(container.querySelector('.sb-dimension-bar--capped')).toBeNull();
  expect(container.querySelector('.sb-dimension-bar__cap')).toBeNull();
});
