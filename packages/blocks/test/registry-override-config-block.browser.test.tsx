import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DimensionScale, SwatchbookProvider } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import { makeResolveAt } from './_snapshot-helpers.ts';

// One dimension token is enough to prove the override is reached; no helper
// for this shape exists yet, so it's built inline (mirrors dimension-scale-cap's
// makeSnapshot / color-format-prop's makeTokenDetailSnapshot).
function makeDimensionSnapshot(): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = makeResolveAt({
    'dimension.md': { $type: 'dimension', $value: { value: 16, unit: 'px' } },
  });
  return snap;
}

const Mine = () => <b data-testid="mine">mine</b>;

afterEach(() => cleanup());

// DimensionScale is a config-carrying query block: DimensionSample takes its
// `visual` knob through `options`, which is why it wasn't routed through the
// registry until this task. This proves the override reaches it like any
// other query block.
it('a provider dimension override renders inside the built-in DimensionScale', () => {
  render(
    <SwatchbookProvider value={makeDimensionSnapshot()} presenters={{ dimension: Mine }}>
      <DimensionScale filter="dimension.**" />
    </SwatchbookProvider>,
  );
  expect(screen.getAllByTestId('mine').length).toBeGreaterThan(0);
});
