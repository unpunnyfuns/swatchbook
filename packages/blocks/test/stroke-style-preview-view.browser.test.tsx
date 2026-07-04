import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import { StrokeStylePreviewView } from '#/StrokeStylePreview.tsx';
import type { StrokeStyleRow } from '#/StrokeStylePreview.tsx';

function rows(): StrokeStyleRow[] {
  return [
    {
      path: 'stroke.style.solid',
      cssVar: 'var(--sb-stroke-style-solid)',
      displayValue: 'solid',
      cssStyle: 'solid',
    },
  ];
}

// The View renders from plain props — no SwatchbookProvider, no store.
it('renders a row per token with its path, value, and css var', () => {
  render(
    <StrokeStylePreviewView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
    />,
  );
  screen.getByText('stroke.style.solid');
  screen.getByText('solid');
  screen.getByText('var(--sb-stroke-style-solid)');
});

it('falls back to the object-form message when the row has no css style keyword', () => {
  const dashedRows: StrokeStyleRow[] = [
    {
      path: 'stroke.style.dashed',
      cssVar: 'var(--sb-stroke-style-dashed)',
      displayValue: 'dashed 4px 2px · round',
      cssStyle: null,
    },
  ];
  render(
    <StrokeStylePreviewView
      rows={dashedRows}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
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
      caption="Stroke styles"
    />,
  );
  screen.getByText('Stroke styles');
});

it('renders the empty state when there are no rows', () => {
  render(
    <StrokeStylePreviewView rows={[]} activeTheme="Light" cssVarPrefix="sb" activeAxes={{}} />,
  );
  screen.getByText('No strokeStyle tokens match this filter.');
});

afterEach(() => {
  cleanup();
});
