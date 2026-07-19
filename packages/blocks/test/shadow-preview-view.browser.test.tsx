import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { ShadowPreviewView } from '#/ShadowPreview.tsx';
import type { ShadowPreviewViewProps, ShadowRow } from '#/ShadowPreview.tsx';

function rows(): ShadowRow[] {
  const token: RealisedToken<'shadow'> = {
    $type: 'shadow',
    $value: { offsetX: '0px', offsetY: '2px', blur: '4px', spread: '0px', color: '#000000' },
  };
  return [
    {
      path: 'shadow.default',
      cssVar: 'var(--sb-shadow-default)',
      token,
      layers: [{ offset: '0px 2px', blur: '4px', spread: '0px', color: '#000000' }],
    },
    {
      path: 'shadow.layered',
      cssVar: 'var(--sb-shadow-layered)',
      token,
      layers: [
        { offset: '0px 1px', blur: '2px', spread: '0px', color: '#000000' },
        { offset: '0px 4px', blur: '8px', spread: '0px', color: '#0066ff', inset: 'true' },
      ],
    },
  ];
}

// The View renders from plain props — no provider, no store. ShadowSample
// (rendered per-row) is a connected child fed this row's token/cssVar
// directly, so it needs no provider either.
function setup(extra: Partial<ShadowPreviewViewProps> = {}) {
  return render(
    <ShadowPreviewView
      rows={rows()}
      activeTheme="Light"
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
      colorFormat="hex"
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders a row per shadow token with its css var and flat breakdown for a single layer', () => {
  setup();
  const row = screen.getByText('shadow.default').closest('.sb-shadow-preview__row') as HTMLElement;
  const scoped = within(row);
  scoped.getByText('var(--sb-shadow-default)');
  scoped.getByText('0px 2px');
  scoped.getByText('4px');
  scoped.getByText('0px');
  scoped.getByText('#000000');
});

it('renders a numbered layer breakdown for a multi-layer shadow, including inset', () => {
  setup();
  const row = screen.getByText('shadow.layered').closest('.sb-shadow-preview__row') as HTMLElement;
  const scoped = within(row);
  scoped.getByText('var(--sb-shadow-layered)');
  scoped.getByText((_, node) => node?.textContent === 'layer 1 of 2');
  scoped.getByText((_, node) => node?.textContent === 'layer 2 of 2');
  scoped.getByText('0px 1px');
  scoped.getByText('0px 4px');
  scoped.getByText('#0066ff');
  scoped.getByText('true');
});

it('shows a default caption naming the count and active theme', () => {
  setup();
  screen.getByText('2 shadows · Light');
});

it('honors a caption override', () => {
  setup({ caption: 'Custom caption' });
  screen.getByText('Custom caption');
});

it('mentions the filter in the default caption when set', () => {
  setup({ filter: 'shadow.*' });
  screen.getByText('2 shadows matching `shadow.*` · Light');
});

it('renders the empty state when there are no rows', () => {
  setup({ rows: [] });
  screen.getByText('No shadow tokens match this filter.');
});
