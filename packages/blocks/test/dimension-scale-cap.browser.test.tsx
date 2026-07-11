import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DimensionSample, DimensionScale, SwatchbookProvider } from '#/index.ts';
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
  expect(container.querySelector('.sb-dimension-sample__cap')).toBeNull();
});

it('caps the same 25rem token when the root font-size is 20px (500px exceeds 480)', () => {
  document.documentElement.style.fontSize = '20px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionScale />
    </SwatchbookProvider>,
  );
  expect(container.querySelector('.sb-dimension-sample--capped')?.getAttribute('title')).toContain(
    'capped at 480px',
  );
  expect(container.querySelector('.sb-dimension-sample__cap')).not.toBeNull();
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
  expect(container.querySelector('.sb-dimension-sample__cap')).toBeNull();

  // A media query bumps the root at a breakpoint: 25rem is now 600px (> 480).
  document.documentElement.style.fontSize = '24px';
  window.dispatchEvent(new Event('resize'));

  await waitFor(() => {
    expect(container.querySelector('.sb-dimension-sample__cap')).not.toBeNull();
  });
});

// The cap indicator now lives in DimensionSample, so every consumer surfaces
// it the same way — including TokenNavigator, which previously clamped the
// bar silently. Rendering DimensionSample directly locks the shared behavior.
it('DimensionSample surfaces the cap marker for an oversized length token', () => {
  document.documentElement.style.fontSize = '20px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionSample path="dimension.wide" visual="length" />
    </SwatchbookProvider>,
  );
  const wrap = container.querySelector('.sb-dimension-sample--capped');
  expect(wrap?.getAttribute('title')).toContain('capped at 480px');
  expect(container.querySelector('.sb-dimension-sample__cap')).not.toBeNull();
  const bar = wrap?.querySelector<HTMLElement>('div');
  expect(bar?.style.width).toBe('480px');
});

it('DimensionSample renders a bare bar (no cap marker) when under the cap', () => {
  document.documentElement.style.fontSize = '16px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionSample path="dimension.wide" visual="length" />
    </SwatchbookProvider>,
  );
  expect(container.querySelector('.sb-dimension-sample--capped')).toBeNull();
  expect(container.querySelector('.sb-dimension-sample__cap')).toBeNull();
});

// A capped bar carries a 480px inline width, which would overflow a narrow
// host like TokenNavigator's preview cell. The bar must fit its container
// (max-width: 100%) so it never blows out the layout, while the cap marker
// stays visible. Regression for the pill (9999px) bar overflowing the cell.
it('a capped bar fits inside a narrow host cell instead of overflowing', () => {
  document.documentElement.style.fontSize = '20px';
  const { container } = render(
    <div style={{ width: 120, maxWidth: 120, display: 'inline-block' }}>
      <SwatchbookProvider value={makeSnapshot()}>
        <DimensionSample path="dimension.wide" visual="length" />
      </SwatchbookProvider>
    </div>,
  );
  const bar = container.querySelector<HTMLElement>('.sb-dimension-sample--capped div');
  // Inline width still records the 480px cap; the rendered width fits the cell.
  expect(bar?.style.width).toBe('480px');
  expect(bar?.getBoundingClientRect().width).toBeLessThanOrEqual(120);
  expect(container.querySelector('.sb-dimension-sample__cap')).not.toBeNull();
});
