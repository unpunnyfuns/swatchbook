import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider } from '#/provider.tsx';
import { PresenterContext, usePresenter } from '#/presenters/registry.ts';
import type { ProjectSnapshot } from '#/contexts.ts';

const EMPTY: ProjectSnapshot = {
  axes: [],
  activeTheme: '',
  activeAxes: {},
  cssVarPrefix: 'sb',
  diagnostics: [],
  defaultTuple: {},
};

function Probe() {
  const P = usePresenter('color');
  return <span data-testid="probe">{P ? 'custom' : 'none'}</span>;
}

const Custom = () => <i>x</i>;

afterEach(() => cleanup());

it('a provider presenters override reaches usePresenter', () => {
  render(
    <SwatchbookProvider value={EMPTY} presenters={{ color: Custom }}>
      <PresenterContext.Consumer>{() => <Probe />}</PresenterContext.Consumer>
    </SwatchbookProvider>,
  );
  expect(screen.getByTestId('probe').textContent).toBe('custom');
});

it('unlisted types fall through (partial merge)', () => {
  render(
    <SwatchbookProvider value={EMPTY} presenters={{ color: () => <i>x</i> }}>
      <PresenterContext.Consumer>{() => <Probe />}</PresenterContext.Consumer>
    </SwatchbookProvider>,
  );
  // color is overridden; a gap type (shadow) stays whatever DEFAULT has (none yet)
  expect(screen.getByTestId('probe').textContent).toBe('custom');
});
