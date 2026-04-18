import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type ProjectSnapshot, SwatchbookProvider, TokenTable } from '#/index.ts';

function makeSnapshot(): ProjectSnapshot {
  return {
    axes: [
      {
        name: 'mode',
        contexts: ['light', 'dark'],
        default: 'light',
        source: 'resolver',
      },
    ],
    presets: [],
    themes: [
      { name: 'Light', input: { mode: 'light' }, sources: [] },
      { name: 'Dark', input: { mode: 'dark' }, sources: [] },
    ],
    themesResolved: {
      Light: {
        'color.sys.text': {
          $type: 'color',
          $value: { hex: '#111111' },
          $description: 'Primary text.',
        },
        'color.sys.surface': {
          $type: 'color',
          $value: { hex: '#ffffff' },
          $description: 'Default surface.',
        },
        'space.sys.md': {
          $type: 'dimension',
          $value: { value: 16, unit: 'px' },
        },
      },
      Dark: {},
    },
    activeTheme: 'Light',
    activeAxes: { mode: 'light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

describe('SwatchbookProvider + blocks (no Storybook, no virtual module)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders TokenTable rows from a hand-built snapshot', () => {
    const snapshot = makeSnapshot();

    render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable />
      </SwatchbookProvider>,
    );

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(4);

    expect(within(table).getByText('color.sys.text')).toBeDefined();
    expect(within(table).getByText('color.sys.surface')).toBeDefined();
    expect(within(table).getByText('space.sys.md')).toBeDefined();

    expect(within(table).getByText('var(--sb-color-sys-text)')).toBeDefined();
  });

  it('honors the filter prop to narrow to a path subtree', () => {
    const snapshot = makeSnapshot();

    render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable filter='color.sys.*' />
      </SwatchbookProvider>,
    );

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(3);

    expect(within(table).queryByText('space.sys.md')).toBeNull();
  });

  it('renders the empty state when the filter matches nothing', () => {
    const snapshot = makeSnapshot();

    render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable filter='typography.sys.*' />
      </SwatchbookProvider>,
    );

    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('No tokens match this filter.')).toBeDefined();
  });
});
