import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from '@vitest/browser/context';
import { type ProjectSnapshot, SwatchbookProvider, TokenNavigator } from '#/index.ts';

function makeSnapshot(): ProjectSnapshot {
  return {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    cells: {
      theme: {
        Light: {
          'color.bg': { $type: 'color', $value: { hex: '#fff' } },
          'color.fg': { $type: 'color', $value: { hex: '#111' } },
          'color.palette.blue.500': { $type: 'color', $value: { hex: '#3b82f6' } },
          'radius.sm': { $type: 'dimension', $value: { value: 4, unit: 'px' } },
        },
      },
    },
    jointOverrides: [],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

describe('TokenNavigator', () => {
  afterEach(() => {
    cleanup();
  });

  it('groups tokens by dot-path prefix in a treeview', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator />
      </SwatchbookProvider>,
    );
    const tree = screen.getByRole('tree');
    // Top-level groups are `color` and `radius` (groups before leaves at the same level).
    const topGroups = within(tree)
      .getAllByTestId('token-navigator-group')
      .filter((el) => el.getAttribute('data-path')?.split('.').length === 1);
    const names = topGroups.map((el) => el.getAttribute('data-path')).toSorted();
    expect(names).toEqual(['color', 'radius']);
  });

  it('scopes the tree under a `root` prop to only that subtree', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator root="color" />
      </SwatchbookProvider>,
    );
    expect(screen.queryByText('radius')).toBeNull();
    // Leaves `bg` and `fg` visible under the scoped root.
    screen.getByText('bg');
    screen.getByText('fg');
  });

  it('shows an empty-state message when the root matches no tokens', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator root="does-not-exist" />
      </SwatchbookProvider>,
    );
    screen.getByText(/No tokens under "does-not-exist"/);
  });

  it('filters by DTCG $type with a single string', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator type="dimension" />
      </SwatchbookProvider>,
    );
    const tree = screen.getByRole('tree');
    const topGroups = within(tree)
      .getAllByTestId('token-navigator-group')
      .filter((el) => el.getAttribute('data-path')?.split('.').length === 1);
    const names = topGroups.map((el) => el.getAttribute('data-path'));
    expect(names).toEqual(['radius']);
    expect(screen.queryByText('bg')).toBeNull();
  });

  it('filters by DTCG $type with an array of types', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator type={['color', 'dimension']} />
      </SwatchbookProvider>,
    );
    const tree = screen.getByRole('tree');
    const topGroups = within(tree)
      .getAllByTestId('token-navigator-group')
      .filter((el) => el.getAttribute('data-path')?.split('.').length === 1);
    const names = topGroups.map((el) => el.getAttribute('data-path')).toSorted();
    expect(names).toEqual(['color', 'radius']);
  });

  it('composes `type` with `root` — both constraints must hold', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator root="color" type="dimension" />
      </SwatchbookProvider>,
    );
    screen.getByText(/No tokens under "color"/);
  });

  it('shows a type-aware empty-state when no tokens match', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator type="fontWeight" />
      </SwatchbookProvider>,
    );
    screen.getByText(/No tokens matching \$type=fontWeight/);
  });

  it('renders a search input by default that prunes the tree to matching leaves', async () => {
    const { container } = render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator />
      </SwatchbookProvider>,
    );

    const input = screen.getByTestId('token-navigator-search') as HTMLInputElement;
    await userEvent.fill(input, 'bg');

    // `color.bg` is the single leaf matching 'bg'; `radius` and `color.fg` /
    // `color.palette.blue.500` prune out.
    const leafPaths = within(screen.getByRole('tree'))
      .getAllByTestId('token-navigator-leaf')
      .map((el) => el.getAttribute('data-path'));
    expect(leafPaths).toEqual(['color.bg']);
    expect(container.textContent).toContain('matching "bg"');
  });

  it('auto-expands groups on the path to a matching leaf', async () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator initiallyExpanded={0} />
      </SwatchbookProvider>,
    );

    const input = screen.getByTestId('token-navigator-search') as HTMLInputElement;
    await userEvent.fill(input, 'blue');

    // `color.palette.blue.500` is nested under `color > palette > blue`.
    // Even though `initiallyExpanded={0}` leaves everything collapsed, the
    // search should reveal the matching leaf.
    const leafPaths = within(screen.getByRole('tree'))
      .getAllByTestId('token-navigator-leaf')
      .map((el) => el.getAttribute('data-path'));
    expect(leafPaths).toContain('color.palette.blue.500');
  });

  it('shows an empty message when the search matches nothing', async () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator />
      </SwatchbookProvider>,
    );

    const input = screen.getByTestId('token-navigator-search') as HTMLInputElement;
    await userEvent.fill(input, 'xyz-no-match');

    screen.getByText(/No tokens match "xyz-no-match"/);
    expect(screen.queryByRole('tree')).toBeNull();
  });

  it('hides the search input when searchable={false}', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator searchable={false} />
      </SwatchbookProvider>,
    );
    expect(screen.queryByTestId('token-navigator-search')).toBeNull();
  });
});
