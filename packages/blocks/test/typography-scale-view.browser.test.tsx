import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import { TypographyScaleView } from '#/TypographyScale.tsx';
import type { TypographyRow } from '#/TypographyScale.tsx';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';

const token: RealisedToken<'typography'> = {
  $type: 'typography',
  $value: { fontFamily: 'Inter', fontSize: { value: 24, unit: 'px' }, fontWeight: 700 },
};

function rows(): TypographyRow[] {
  return [{ path: 'typography.heading', cssVar: 'var(--sb-typography-heading)', token }];
}

// The View renders from plain props — no SwatchbookProvider, no store.
it('renders a row per token with its leaf label and sample', () => {
  render(
    <TypographyScaleView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      sample="Hello"
      colorFormat="hex"
    />,
  );
  screen.getByText('heading');
  screen.getByText('Hello');
});

it('honors the caption override', () => {
  render(
    <TypographyScaleView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      sample="Hello"
      colorFormat="hex"
      caption="Type scale"
    />,
  );
  screen.getByText('Type scale');
});

it('renders the empty state when there are no rows', () => {
  render(
    <TypographyScaleView
      rows={[]}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      sample="Hello"
      colorFormat="hex"
    />,
  );
  screen.getByText('No typography tokens match this filter.');
});

afterEach(() => {
  cleanup();
});
