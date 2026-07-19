import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { GradientPalette, SwatchbookContext } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import { makeResolveAt } from './_snapshot-helpers.ts';

// A gradient with a Display-P3 first stop and an sRGB second stop. The old
// stopCssColor rendered every stop's components as raw sRGB percentages,
// mislabeling the P3 stop as sRGB; routing through parseColor respects the
// colorSpace and emits a gamut-correct `color(display-p3 …)` string.
function makeSnapshot(): ProjectSnapshot {
  const tokens = {
    'gradient.brand': {
      $type: 'gradient',
      $value: [
        { color: { colorSpace: 'display-p3', components: [1, 0, 0] }, position: 0 },
        { color: { colorSpace: 'srgb', components: [0, 0, 0] }, position: 1 },
      ],
    },
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
});

it('renders a wide-gamut stop in its own color space, not as raw sRGB percentages', () => {
  const { container } = render(
    <SwatchbookContext.Provider value={makeSnapshot()}>
      <GradientPalette />
    </SwatchbookContext.Provider>,
  );
  const swatches = container.querySelectorAll<HTMLElement>('.sb-gradient-palette__stop-swatch');
  expect(swatches.length).toBe(2);
  const p3Background = swatches[0]?.style.background ?? '';
  // The Display-P3 red stop keeps its gamut via color(display-p3 …); it must
  // not be flattened to the old `rgb(100% 0% 0%)` sRGB-percentage rendering.
  expect(p3Background).toContain('display-p3');
  expect(p3Background).not.toMatch(/%/);
});
