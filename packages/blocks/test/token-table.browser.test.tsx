import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from '@vitest/browser/context';
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
    disabledAxes: [],
    presets: [],
    cells: {
      mode: {
        light: {
          'color.text': {
            $type: 'color',
            $value: { hex: '#111111' },
            $description: 'Primary text.',
          },
          'color.surface': {
            $type: 'color',
            $value: { hex: '#ffffff' },
            $description: 'Default surface.',
          },
          'space.md': {
            $type: 'dimension',
            $value: { value: 16, unit: 'px' },
          },
        },
        dark: {},
      },
    },
    jointOverrides: [],
    defaultTuple: { mode: 'light' },
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

    within(table).getByText('color.text');
    within(table).getByText('color.surface');
    within(table).getByText('space.md');
  });

  it('clicking a row opens the TokenDetail overlay by default', async () => {
    const snapshot = makeSnapshot();
    const { findByTestId } = render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable />
      </SwatchbookProvider>,
    );

    const rows = screen.getAllByTestId('token-table-row');
    const target = rows.find((r) => r.getAttribute('data-path') === 'color.text');
    if (!target) throw new Error('row not found');
    target.click();

    await findByTestId('token-table-overlay');
  });

  it('onSelect suppresses the overlay and hands the path to the consumer', () => {
    const snapshot = makeSnapshot();
    const picks: string[] = [];
    render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable onSelect={(p) => picks.push(p)} />
      </SwatchbookProvider>,
    );
    const rows = screen.getAllByTestId('token-table-row');
    rows[0]?.click();
    expect(picks.length).toBe(1);
    expect(screen.queryByTestId('token-table-overlay')).toBeNull();
  });

  it('honors the filter prop to narrow to a path subtree', () => {
    const snapshot = makeSnapshot();

    render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable filter="color.*" />
      </SwatchbookProvider>,
    );

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(3);

    expect(within(table).queryByText('space.md')).toBeNull();
  });

  it('renders a search input by default that filters rows by substring', async () => {
    const snapshot = makeSnapshot();
    const { container } = render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable />
      </SwatchbookProvider>,
    );

    const input = screen.getByTestId('token-table-search') as HTMLInputElement;
    const before = within(screen.getByRole('table')).getAllByRole('row').length;
    expect(before).toBeGreaterThan(2);

    // Typing narrows rows to those whose path contains the needle.
    await userEvent.fill(input, 'surface');

    const after = within(screen.getByRole('table')).getAllByRole('row');
    // Header row + at least one matching row; no non-matching rows.
    const bodyRows = after.filter((r) => r.getAttribute('data-path'));
    expect(bodyRows.length).toBeGreaterThan(0);
    for (const row of bodyRows) {
      expect(row.getAttribute('data-path')).toContain('surface');
    }
    expect(container.textContent).toContain('matching "surface"');
  });

  it('shows a "no matches" row when the search query matches nothing', async () => {
    const snapshot = makeSnapshot();
    render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable />
      </SwatchbookProvider>,
    );

    const input = screen.getByTestId('token-table-search') as HTMLInputElement;
    await userEvent.fill(input, 'xyz-no-match');

    screen.getByText(/No tokens match "xyz-no-match"/);
  });

  it('hides the search input when searchable={false}', () => {
    const snapshot = makeSnapshot();
    render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable searchable={false} />
      </SwatchbookProvider>,
    );

    expect(screen.queryByTestId('token-table-search')).toBeNull();
  });

  it('renders the empty state when the filter matches nothing', () => {
    const snapshot = makeSnapshot();

    render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable filter="typography.*" />
      </SwatchbookProvider>,
    );

    expect(screen.queryByRole('table')).toBeNull();
    screen.getByText('No tokens match this filter.');
  });

  it('does not carry any chrome-aliasing inline style on the wrapper', () => {
    const snapshot: ProjectSnapshot = { ...makeSnapshot(), cssVarPrefix: 'swatch' };

    const { container } = render(
      <SwatchbookProvider value={snapshot}>
        <TokenTable />
      </SwatchbookProvider>,
    );

    const wrapper = container.querySelector('[data-swatch-theme]') as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.getPropertyValue('--swatchbook-color-border-default')).toBe('');
    expect(wrapper?.style.getPropertyValue('--sb-color-border-default')).toBe('');
  });
});
