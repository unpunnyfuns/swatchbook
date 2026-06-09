import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SwatchbookProvider, TokenDetail } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import { makeResolveAt } from './_snapshot-helpers.ts';

function makeSnapshot(): ProjectSnapshot {
  const tokens = {
    'color.brand.primary': { $type: 'color', $value: { hex: '#3b82f6' } },
  };
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = makeResolveAt(tokens);
  return snap;
}

describe('TokenDetail', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the token value for a known path', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenDetail path="color.brand.primary" />
      </SwatchbookProvider>,
    );
    expect(screen.getByRole('heading', { name: 'color.brand.primary' })).toBeDefined();
  });

  it('shows the not-found message for an unknown path', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenDetail path="color.missing" />
      </SwatchbookProvider>,
    );
    expect(screen.getByText(/not found in theme/)).toBeDefined();
  });

  it('survives the token disappearing between renders', () => {
    // Regression guard: useProject() used to be called after the
    // missing-token early return, so flipping a present token to a
    // missing one changed the hook order and crashed React.
    const snapshot = makeSnapshot();
    const { rerender } = render(
      <SwatchbookProvider value={snapshot}>
        <TokenDetail path="color.brand.primary" />
      </SwatchbookProvider>,
    );
    expect(() =>
      rerender(
        <SwatchbookProvider value={snapshot}>
          <TokenDetail path="color.gone" />
        </SwatchbookProvider>,
      ),
    ).not.toThrow();
    expect(screen.getByText(/not found in theme/)).toBeDefined();
  });
});
