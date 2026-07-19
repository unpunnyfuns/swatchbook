import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SwatchbookContext, TokenDetail } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import { makeResolveAt } from './_snapshot-helpers.ts';

function makeSnapshot(
  extraTokens: Record<
    string,
    { $type: string; $value: unknown; $deprecated?: string | boolean }
  > = {},
): ProjectSnapshot {
  const tokens = {
    'color.brand.primary': { $type: 'color', $value: { hex: '#3b82f6' } },
    ...extraTokens,
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
      <SwatchbookContext.Provider value={makeSnapshot()}>
        <TokenDetail path="color.brand.primary" />
      </SwatchbookContext.Provider>,
    );
    expect(screen.getByRole('heading', { name: 'color.brand.primary' })).toBeDefined();
  });

  it('shows the not-found message for an unknown path', () => {
    render(
      <SwatchbookContext.Provider value={makeSnapshot()}>
        <TokenDetail path="color.missing" />
      </SwatchbookContext.Provider>,
    );
    expect(screen.getByText(/not found in theme/)).toBeDefined();
  });

  it('survives the token disappearing between renders', () => {
    // Regression guard: useProject() used to be called after the
    // missing-token early return, so flipping a present token to a
    // missing one changed the hook order and crashed React.
    const snapshot = makeSnapshot();
    const { rerender } = render(
      <SwatchbookContext.Provider value={snapshot}>
        <TokenDetail path="color.brand.primary" />
      </SwatchbookContext.Provider>,
    );
    expect(() =>
      rerender(
        <SwatchbookContext.Provider value={snapshot}>
          <TokenDetail path="color.gone" />
        </SwatchbookContext.Provider>,
      ),
    ).not.toThrow();
    expect(screen.getByText(/not found in theme/)).toBeDefined();
  });

  it('renders a deprecation notice with the message', async () => {
    render(
      <SwatchbookContext.Provider
        value={makeSnapshot({
          'color.old': {
            $type: 'color',
            $value: { hex: '#f00' },
            $deprecated: 'use color.new instead',
          },
        })}
      >
        <TokenDetail path="color.old" />
      </SwatchbookContext.Provider>,
    );
    const notice = await screen.findByTestId('token-detail-deprecated');
    expect(notice.textContent).toContain('use color.new instead');
  });
});
