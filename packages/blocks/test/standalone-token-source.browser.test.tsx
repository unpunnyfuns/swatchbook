import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Diagnostics, registerTokenSource } from '#/index.ts';

// Blocks must import and render with no Storybook addon present — no
// `virtual:swatchbook/tokens` module, no provider, nothing registered.
// (This file's vitest config no longer aliases that virtual module, so a
// lingering import of it would fail to resolve at load.) The addon preview
// injects the real snapshot via registerTokenSource; standalone consumers
// get empty defaults.

afterEach(() => {
  cleanup();
});

it('renders from empty defaults with no provider and no registered source', () => {
  const { container } = render(<Diagnostics />);
  // No crash; the empty-diagnostics state shows.
  expect(container.textContent).toContain('no diagnostics');
});

it('registerTokenSource seeds the snapshot blocks read without a provider', () => {
  registerTokenSource({
    diagnostics: [{ severity: 'error', group: 'parser', message: 'broke here' }],
  });
  const { getByText } = render(<Diagnostics />);
  expect(getByText(/broke here/)).toBeDefined();
});
