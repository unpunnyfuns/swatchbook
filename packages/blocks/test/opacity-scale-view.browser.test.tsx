import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { OpacityScaleView } from '#/OpacityScale.tsx';
import type { OpacityRow } from '#/OpacityScale.tsx';

function rows(): OpacityRow[] {
  const token: RealisedToken<'number'> = { $type: 'number', $value: 0.2 };
  return [
    {
      path: 'number.opacity.subtle',
      cssVar: 'var(--sb-number-opacity-subtle)',
      opacity: 0.2,
      displayValue: '0.2',
      token,
    },
  ];
}

// The View renders from plain props — no SwatchbookProvider, no store.
// OpacitySwatch (rendered per-row) is a connected child fed this row's
// token/cssVar directly, so it needs no provider either.
it('renders a card per token with its path, value, and css var', () => {
  render(
    <OpacityScaleView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      sampleColorVar="var(--sb-color-accent-bg)"
      colorFormat="hex"
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
      colorFormat="hex"
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
      colorFormat="hex"
    />,
  );
  screen.getByText('No opacity tokens match this filter.');
});

afterEach(() => {
  cleanup();
});
