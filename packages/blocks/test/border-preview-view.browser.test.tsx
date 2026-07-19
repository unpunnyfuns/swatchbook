import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { BorderPreviewView } from '#/BorderPreview.tsx';
import type { BorderPreviewViewProps, BorderRow } from '#/BorderPreview.tsx';

function rows(): BorderRow[] {
  const token: RealisedToken<'border'> = {
    $type: 'border',
    $value: { width: { value: 1, unit: 'px' }, style: 'solid', color: '#000000' },
  };
  return [
    {
      path: 'border.default',
      cssVar: 'var(--sb-border-default)',
      token,
      width: '1px',
      style: 'solid',
      color: '#000000',
    },
    {
      path: 'border.focus',
      cssVar: 'var(--sb-border-focus)',
      token,
      width: '2px',
      style: 'dashed',
      color: '#0066ff',
    },
  ];
}

// The View renders from plain props — no provider, no store. BorderSample
// (rendered per-row) is a connected child fed this row's token/cssVar
// directly, so it needs no provider either.
function setup(extra: Partial<BorderPreviewViewProps> = {}) {
  return render(
    <BorderPreviewView
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

it('renders a row per border token with its css var and breakdown', () => {
  setup();
  screen.getByText('border.default');
  screen.getByText('var(--sb-border-default)');
  screen.getByText('1px');
  screen.getByText('solid');
  screen.getByText('#000000');
  screen.getByText('border.focus');
  screen.getByText('var(--sb-border-focus)');
  screen.getByText('2px');
  screen.getByText('dashed');
  screen.getByText('#0066ff');
});

it('shows a default caption naming the count and active theme', () => {
  setup();
  screen.getByText('2 borders · Light');
});

it('honors a caption override', () => {
  setup({ caption: 'Custom caption' });
  screen.getByText('Custom caption');
});

it('mentions the filter in the default caption when set', () => {
  setup({ filter: 'border.*' });
  screen.getByText('2 borders matching `border.*` · Light');
});

it('renders the empty state when there are no rows', () => {
  setup({ rows: [] });
  screen.getByText('No border tokens match this filter.');
});
