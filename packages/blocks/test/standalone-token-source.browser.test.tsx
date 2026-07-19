import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { registerProjectSource } from '#/host.ts';
import { Diagnostics } from '#/index.ts';

// Blocks must import and render with no Storybook addon present — no
// `virtual:swatchbook/tokens` module, no provider, nothing registered.
// (This file's vitest config no longer aliases that virtual module, so a
// lingering import of it would fail to resolve at load.) A host (the addon
// preview, in production) injects the real snapshot via
// registerProjectSource; standalone consumers get empty defaults.

afterEach(() => {
  cleanup();
  // registerProjectSource patches are partial and retain omitted fields, so
  // resetting only `diagnostics` would leave a lingering seed on the
  // module-level store for later files sharing the same worker. Restore the
  // full baseline source instead.
  registerProjectSource({
    axes: [],
    presets: [],
    diagnostics: [],
    css: '',
    cssVarPrefix: '',
    indicators: {},
    listing: {},
    tokenGraph: { nodes: {}, axes: [], axisDefaults: {}, axisContexts: {} },
    defaultTuple: {},
    defaultColorFormat: 'hex',
    activeAxes: null,
  });
});

it('renders from empty defaults with no provider and no registered source', () => {
  const { container } = render(<Diagnostics />);
  // No crash; the empty-diagnostics state shows.
  expect(container.textContent).toContain('no diagnostics');
});

it('registerProjectSource seeds the snapshot blocks read without a provider', () => {
  registerProjectSource({
    diagnostics: [{ severity: 'error', group: 'parser', message: 'broke here' }],
  });
  const { getByText } = render(<Diagnostics />);
  expect(getByText(/broke here/)).toBeDefined();
});
