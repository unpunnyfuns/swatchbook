import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookContext, TokenNavigator, TokenTable } from '#/index.ts';
import type { ProjectSnapshot, VirtualToken } from '#/index.ts';

const TOKENS: Record<string, VirtualToken> = {
  'color.brand': {
    $type: 'color',
    $value: { hex: '#00f' },
    $description: 'Brand',
    $deprecated: 'old',
  },
};

function snapshot(indicators?: Record<string, boolean>): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    axes: [],
    defaultTuple: {},
    activeTheme: 'default',
    activeAxes: {},
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  if (indicators) snap.indicators = indicators;
  snap.resolveAt = () => TOKENS;
  return snap;
}

afterEach(cleanup);

it('TokenNavigator indicators={false} renders no strip', () => {
  render(
    <SwatchbookContext.Provider value={snapshot()}>
      <TokenNavigator searchable={false} indicators={false} />
    </SwatchbookContext.Provider>,
  );
  expect(screen.queryByTestId('row-indicator-deprecated')).toBeNull();
});

it('TokenTable indicators={{ description: true }} shows the description glyph', () => {
  render(
    <SwatchbookContext.Provider value={snapshot()}>
      <TokenTable type="color" indicators={{ description: true }} />
    </SwatchbookContext.Provider>,
  );
  expect(screen.getByTestId('row-indicator-description')).toBeTruthy();
});

it('TokenTable indicators={{ deprecation: false }} drops the badge and the path strikethrough', () => {
  render(
    <SwatchbookContext.Provider value={snapshot()}>
      <TokenTable type="color" indicators={{ deprecation: false }} />
    </SwatchbookContext.Provider>,
  );
  expect(screen.queryByTestId('row-indicator-deprecated')).toBeNull();
  const pathCell = screen.getByText('color.brand').closest('td')!;
  expect(pathCell.getAttribute('data-deprecated')).toBeNull();
});

it('config.indicators baseline shows the description glyph with no per-block prop', () => {
  render(
    <SwatchbookContext.Provider value={snapshot({ description: true })}>
      <TokenTable type="color" />
    </SwatchbookContext.Provider>,
  );
  expect(screen.getByTestId('row-indicator-description')).toBeTruthy();
});

it('per-block indicators prop overrides a config.indicators baseline back off', () => {
  render(
    <SwatchbookContext.Provider value={snapshot({ description: true })}>
      <TokenTable type="color" indicators={{ description: false }} />
    </SwatchbookContext.Provider>,
  );
  expect(screen.queryByTestId('row-indicator-description')).toBeNull();
});
