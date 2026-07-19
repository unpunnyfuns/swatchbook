import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DimensionScale, SwatchbookProvider } from '#/index.ts';
import { makeTokenGraph, makeWireSnapshot } from './_wire-helpers.ts';

const Mine = () => <b data-testid="mine">mine</b>;

afterEach(() => cleanup());

// DimensionScale is a config-carrying query block: DimensionSample takes its
// `visual` knob through `options`, which is why it wasn't routed through the
// registry until this task. This proves the override reaches it like any
// other query block.
it('a provider dimension override renders inside the built-in DimensionScale', () => {
  const snapshot = makeWireSnapshot({
    tokenGraph: makeTokenGraph({
      'dimension.md': { $type: 'dimension', $value: { value: 16, unit: 'px' } },
    }),
  });
  render(
    <SwatchbookProvider
      snapshot={snapshot}
      defaultAxes={{ mode: 'Light' }}
      presenters={{ dimension: Mine }}
    >
      <DimensionScale filter="dimension.**" />
    </SwatchbookProvider>,
  );
  expect(screen.getAllByTestId('mine').length).toBeGreaterThan(0);
});
