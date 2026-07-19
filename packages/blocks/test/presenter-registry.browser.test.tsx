import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider } from '#/provider.tsx';
import { PresenterContext, usePresenter } from '#/presenters/registry.ts';
import { makeWireSnapshot } from './_wire-helpers.ts';

function Probe() {
  const P = usePresenter('color');
  return <span data-testid="probe">{P ? 'custom' : 'none'}</span>;
}

function DimensionProbe() {
  const P = usePresenter('dimension');
  return <span data-testid="probe">{P ? 'defined' : 'none'}</span>;
}

const Custom = () => <i>x</i>;

afterEach(() => cleanup());

it('a provider presenters override reaches usePresenter', () => {
  render(
    <SwatchbookProvider
      snapshot={makeWireSnapshot()}
      defaultAxes={{ mode: 'Light' }}
      presenters={{ color: Custom }}
    >
      <PresenterContext.Consumer>{() => <Probe />}</PresenterContext.Consumer>
    </SwatchbookProvider>,
  );
  expect(screen.getByTestId('probe').textContent).toBe('custom');
});

it('unlisted types fall through (partial merge)', () => {
  render(
    <SwatchbookProvider
      snapshot={makeWireSnapshot()}
      defaultAxes={{ mode: 'Light' }}
      presenters={{ color: Custom }}
    >
      <PresenterContext.Consumer>{() => <DimensionProbe />}</PresenterContext.Consumer>
    </SwatchbookProvider>,
  );
  // color is overridden by the provider; dimension is untouched, so it must
  // still resolve to DEFAULT_PRESENTERS.dimension rather than disappearing.
  expect(screen.getByTestId('probe').textContent).toBe('defined');
});
