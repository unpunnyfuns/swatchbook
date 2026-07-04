import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import { FontFamilyPreviewView } from '#/FontFamilyPreview.tsx';
import type { FontFamilyRow } from '#/FontFamilyPreview.tsx';

function rows(): FontFamilyRow[] {
  return [
    {
      path: 'font.family.body',
      cssVar: 'var(--sb-font-family-body)',
      stack: 'Inter, sans-serif',
    },
  ];
}

// The View renders from plain props — no SwatchbookProvider, no store.
it('renders a row per token with its path, stack, and css var', () => {
  render(
    <FontFamilyPreviewView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      sample="Hello"
    />,
  );
  screen.getByText('font.family.body');
  screen.getByText('Inter, sans-serif');
  screen.getByText('Hello');
  screen.getByText('var(--sb-font-family-body)');
});

it('honors the caption override', () => {
  render(
    <FontFamilyPreviewView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      sample="Hello"
      caption="Font stacks"
    />,
  );
  screen.getByText('Font stacks');
});

it('renders the empty state when there are no rows', () => {
  render(
    <FontFamilyPreviewView
      rows={[]}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{}}
      sample="Hello"
    />,
  );
  screen.getByText('No fontFamily tokens match this filter.');
});

afterEach(() => {
  cleanup();
});
