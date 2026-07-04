import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import { FontWeightScaleView } from '#/FontWeightScale.tsx';
import type { FontWeightRow } from '#/FontWeightScale.tsx';

function rows(): FontWeightRow[] {
  return [
    {
      path: 'font.weight.regular',
      cssVar: 'var(--sb-font-weight-regular)',
      display: '400',
      weight: 400,
    },
  ];
}

// The View renders from plain props — no SwatchbookProvider, no store.
it('renders a row per token with its path, weight, and css var', () => {
  render(
    <FontWeightScaleView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      sample="Aa"
    />,
  );
  screen.getByText('font.weight.regular');
  screen.getByText('400');
  screen.getByText('Aa');
  screen.getByText('var(--sb-font-weight-regular)');
});

it('honors the caption override', () => {
  render(
    <FontWeightScaleView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      sample="Aa"
      caption="Font weights"
    />,
  );
  screen.getByText('Font weights');
});

it('renders the empty state when there are no rows', () => {
  render(
    <FontWeightScaleView
      rows={[]}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      sample="Aa"
    />,
  );
  screen.getByText('No fontWeight tokens match this filter.');
});

afterEach(() => {
  cleanup();
});
