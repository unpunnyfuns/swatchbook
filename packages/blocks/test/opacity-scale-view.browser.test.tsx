import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import { OpacityScaleView } from '#/OpacityScale.tsx';
import type { OpacityRow } from '#/OpacityScale.tsx';

function rows(): OpacityRow[] {
  return [
    {
      path: 'number.opacity.subtle',
      cssVar: 'var(--sb-number-opacity-subtle)',
      opacity: 0.2,
      displayValue: '0.2',
    },
  ];
}

// The View renders from plain props — no SwatchbookProvider, no store.
it('renders a card per token with its path, value, and css var', () => {
  render(
    <OpacityScaleView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      sampleColorVar="var(--sb-color-accent-bg)"
    />,
  );
  screen.getByText('number.opacity.subtle');
  screen.getByText('0.2');
  screen.getByText('var(--sb-number-opacity-subtle)');
});

it('honors the caption override', () => {
  render(
    <OpacityScaleView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      sampleColorVar="var(--sb-color-accent-bg)"
      caption="Opacity scale"
    />,
  );
  screen.getByText('Opacity scale');
});

it('renders the empty state when there are no rows', () => {
  render(
    <OpacityScaleView
      rows={[]}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      sampleColorVar="var(--sb-color-accent-bg)"
    />,
  );
  screen.getByText('No opacity tokens match this filter.');
});

afterEach(() => {
  cleanup();
});
