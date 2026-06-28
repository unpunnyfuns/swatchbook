import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DimensionScale, SwatchbookProvider } from '#/index.ts';
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
  expect(container.querySelector('.sb-dimension-scale__cap')).toBeNull();
});

it('caps the same 25rem token when the root font-size is 20px (500px exceeds 480)', () => {
  document.documentElement.style.fontSize = '20px';
  const { container } = render(
    <SwatchbookProvider value={makeSnapshot()}>
      <DimensionScale />
    </SwatchbookProvider>,
  );
  expect(container.querySelector('.sb-dimension-scale__cap')?.textContent).toContain(
    'capped at 480px',
  );
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
  expect(container.querySelector('.sb-dimension-scale__cap')).toBeNull();

  // A media query bumps the root at a breakpoint: 25rem is now 600px (> 480).
  document.documentElement.style.fontSize = '24px';
  window.dispatchEvent(new Event('resize'));

  await waitFor(() => {
    expect(container.querySelector('.sb-dimension-scale__cap')?.textContent).toContain(
      'capped at 480px',
    );
  });
});
