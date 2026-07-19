import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { StrokeStylePreviewView } from '#/StrokeStylePreview.tsx';
import type { StrokeStyleRow } from '#/StrokeStylePreview.tsx';

function rows(): StrokeStyleRow[] {
  const token: RealisedToken<'strokeStyle'> = { $type: 'strokeStyle', $value: 'solid' };
  return [
    {
      path: 'stroke.style.solid',
      cssVar: 'var(--sb-stroke-style-solid)',
      displayValue: 'solid',
      token,
    },
  ];
}

// The View renders from plain props — no SwatchbookProvider, no store.
// StrokeSample (rendered per-row) is a connected child fed this row's
// token/cssVar directly, so it needs no provider either.
it('renders a row per token with its path, value, and css var', () => {
  render(
    <StrokeStylePreviewView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      colorFormat="hex"
    />,
  );
  screen.getByText('stroke.style.solid');
  screen.getByText('solid');
  screen.getByText('var(--sb-stroke-style-solid)');
});

it('falls back to the object-form message when the row token has a dash-pattern object value', () => {
  const dashedToken: RealisedToken<'strokeStyle'> = {
    $type: 'strokeStyle',
    $value: {
      dashArray: [
        { value: 4, unit: 'px' },
        { value: 2, unit: 'px' },
      ],
      lineCap: 'round',
    },
  };
  const dashedRows: StrokeStyleRow[] = [
    {
      path: 'stroke.style.dashed',
      cssVar: 'var(--sb-stroke-style-dashed)',
      displayValue: 'dashed 4px 2px · round',
      token: dashedToken,
    },
  ];
  render(
    <StrokeStylePreviewView
      rows={dashedRows}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      colorFormat="hex"
    />,
  );
  screen.getByText('Object-form (dashArray + lineCap) — no pure CSS `border-style` equivalent.');
});

it('honors the caption override', () => {
  render(
    <StrokeStylePreviewView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      colorFormat="hex"
      caption="Stroke styles"
    />,
  );
  screen.getByText('Stroke styles');
});

it('renders the empty state when there are no rows', () => {
  render(
    <StrokeStylePreviewView
      rows={[]}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      colorFormat="hex"
    />,
  );
  screen.getByText('No strokeStyle tokens match this filter.');
});

afterEach(() => {
  cleanup();
});
