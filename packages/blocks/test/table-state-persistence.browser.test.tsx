/**
 * TokenTable / ColorTable UI state must survive a docs-mode remount, the same
 * way TokenNavigator's does. MDX docs mode unmounts and remounts embedded
 * blocks on every globals change, so search/selection held in plain component
 * state would be lost. Each block routes that state through the module-level
 * `persistent-state` store; these tests assert the search query survives a
 * full destroy/recreate.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { ColorTable, SwatchbookContext, TokenTable } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import type { VirtualToken } from '#/types.ts';

const TOKENS: Record<string, VirtualToken> = {
  'color.alpha': { $type: 'color', $value: { hex: '#101010' } },
  'color.beta': { $type: 'color', $value: { hex: '#202020' } },
};

function snapshot(): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light', 'Dark'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = () => TOKENS;
  return snap;
}

afterEach(cleanup);

it('TokenTable keeps its search query across a full remount (docs mode)', async () => {
  const view = () => (
    <SwatchbookContext.Provider value={snapshot()}>
      <TokenTable id="persist" />
    </SwatchbookContext.Provider>
  );
  const { unmount } = render(view());

  await userEvent.type(screen.getByPlaceholderText('Search tokens…'), 'alpha');
  expect((screen.getByPlaceholderText('Search tokens…') as HTMLInputElement).value).toBe('alpha');

  unmount();
  render(view());

  expect((screen.getByPlaceholderText('Search tokens…') as HTMLInputElement).value).toBe('alpha');
});

it('ColorTable keeps its search query across a full remount (docs mode)', async () => {
  const view = () => (
    <SwatchbookContext.Provider value={snapshot()}>
      <ColorTable id="persist" />
    </SwatchbookContext.Provider>
  );
  const { unmount } = render(view());

  await userEvent.type(screen.getByPlaceholderText('Search colors…'), 'beta');
  expect((screen.getByPlaceholderText('Search colors…') as HTMLInputElement).value).toBe('beta');

  unmount();
  render(view());

  expect((screen.getByPlaceholderText('Search colors…') as HTMLInputElement).value).toBe('beta');
});
