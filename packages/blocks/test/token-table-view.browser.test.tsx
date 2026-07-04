import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, it } from 'vitest';
import { TokenTableView } from '#/TokenTable.tsx';
import type { TokenRow, TokenTableViewProps } from '#/TokenTable.tsx';
import { resolveIndicators } from '#/indicators/resolve.ts';

function rows(): TokenRow[] {
  return [
    {
      path: 'color.brand',
      type: 'color',
      value: '#0066ff',
      outOfGamut: false,
      cssVar: 'var(--sb-color-brand)',
      isColor: true,
      isDeprecated: false,
      token: {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0.4, 1] },
      } as TokenRow['token'],
      variance: undefined,
    },
    {
      path: 'space.md',
      type: 'dimension',
      value: '16px',
      outOfGamut: false,
      cssVar: 'var(--sb-space-md)',
      isColor: false,
      isDeprecated: false,
      token: { $type: 'dimension', $value: { value: 16, unit: 'px' } } as TokenRow['token'],
      variance: undefined,
    },
  ];
}

// The View renders + filters from plain props — no provider, no store.
// (Row-click opens the connected DetailOverlay, which needs a project; that
// interaction stays covered by the connector-level detail-overlay tests.)
function setup(extra: Partial<TokenTableViewProps> = {}) {
  return render(
    <TokenTableView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      colorFormat="hex"
      enabledIndicators={resolveIndicators(undefined, {})}
      validPaths={new Set(['color.brand', 'space.md'])}
      blockKey="test::TokenTable"
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders a row per token with its value', () => {
  setup();
  screen.getByText('color.brand');
  screen.getByText('space.md');
  expect(screen.getAllByTestId('token-table-row')).toHaveLength(2);
});

it('narrows visible rows via the search input', async () => {
  setup();
  await userEvent.type(screen.getByTestId('token-table-search'), 'brand');
  expect(screen.getAllByTestId('token-table-row')).toHaveLength(1);
  screen.getByText('color.brand');
});
