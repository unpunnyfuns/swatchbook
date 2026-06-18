import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookProvider, TokenNavigator, TokenTable } from '#/index.ts';
import type { ProjectSnapshot, VirtualTokenShape } from '#/index.ts';

const TOKENS: Record<string, VirtualTokenShape> = {
  'color.brand': {
    $type: 'color',
    $value: { hex: '#00f' },
    $description: 'Brand',
    $deprecated: 'old',
  },
};

function snapshot(): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    axes: [],
    defaultTuple: {},
    activeTheme: 'default',
    activeAxes: {},
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = () => TOKENS;
  return snap;
}

afterEach(cleanup);

it('TokenNavigator indicators={false} renders no strip', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <TokenNavigator searchable={false} indicators={false} />
    </SwatchbookProvider>,
  );
  expect(screen.queryByTestId('row-indicator-deprecated')).toBeNull();
});

it('TokenTable indicators={{ description: true }} shows the description glyph', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <TokenTable type="color" indicators={{ description: true }} />
    </SwatchbookProvider>,
  );
  expect(screen.getByTestId('row-indicator-description')).toBeTruthy();
});

it('TokenTable indicators={{ deprecation: false }} drops the badge and the path strikethrough', () => {
  render(
    <SwatchbookProvider value={snapshot()}>
      <TokenTable type="color" indicators={{ deprecation: false }} />
    </SwatchbookProvider>,
  );
  expect(screen.queryByTestId('row-indicator-deprecated')).toBeNull();
  const pathCell = screen.getByText('color.brand').closest('td')!;
  expect(pathCell.getAttribute('data-deprecated')).toBeNull();
});
