import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it, expect } from 'vitest';
import { TokenDetailView } from '#/TokenDetail.tsx';
import type { TokenDetailViewProps } from '#/TokenDetail.tsx';
import type { DetailToken } from '#/token-detail/internal.ts';

const colorToken: DetailToken = {
  $type: 'color',
  $value: { colorSpace: 'srgb', components: [0, 0.4, 1] },
};

// The View renders from plain props — no provider, no store. TokenHeader /
// CompositePreview / CompositeBreakdown / AliasChain / AliasedBy /
// TokenUsageSnippet / ConsumerOutput / AxisVariance are connected children
// that read the project themselves; with no provider mounted they fall back
// to their own empty states, which is fine here since only the View's own
// output — the resolved-value section header and the copy button — is
// under test.
function setup(extra: Partial<TokenDetailViewProps> = {}) {
  return render(
    <TokenDetailView
      path="color.brand"
      token={colorToken}
      cssVar="var(--sb-color-brand)"
      activeTheme="Light"
      activeAxes={{ theme: 'Light' }}
      cssVarPrefix="sb"
      value="#0066ff"
      outOfGamut={false}
      isColor
      isDeprecated={false}
      deprecationMessage={undefined}
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders the resolved-value section header naming the active theme', () => {
  setup();
  screen.getByText('Resolved value · Light');
});

it('renders the value and a copy button for it', () => {
  setup();
  screen.getByText('#0066ff');
  const button = screen.getByRole('button', { name: 'Copy value #0066ff' });
  expect(button).toBeDefined();
});

it('shows the out-of-gamut warning icon when flagged', () => {
  setup({ outOfGamut: true });
  screen.getByLabelText('out of gamut');
});

it('shows the deprecation notice with its message', () => {
  setup({ isDeprecated: true, deprecationMessage: 'use color.new instead' });
  expect(screen.getByTestId('token-detail-deprecated').textContent).toContain(
    'use color.new instead',
  );
});

it('renders the missing message instead when there is no token', () => {
  setup({ token: undefined });
  screen.getByText(/not found in theme/);
});
