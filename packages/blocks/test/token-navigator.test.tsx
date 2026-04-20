import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type ProjectSnapshot, SwatchbookProvider, TokenNavigator } from '#/index.ts';

function makeSnapshot(): ProjectSnapshot {
  return {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    themes: [{ name: 'Light', input: { theme: 'Light' }, sources: [] }],
    themesResolved: {
      Light: {
        'color.sys.bg': { $type: 'color', $value: { hex: '#fff' } },
        'color.sys.fg': { $type: 'color', $value: { hex: '#111' } },
        'color.ref.blue.500': { $type: 'color', $value: { hex: '#3b82f6' } },
        'radius.sm': { $type: 'dimension', $value: { value: 4, unit: 'px' } },
      },
    },
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
        <TokenNavigator root="color.sys" />
      </SwatchbookProvider>,
    );
    expect(screen.queryByText('ref')).toBeNull();
    expect(screen.queryByText('radius')).toBeNull();
    // Leaves `bg` and `fg` visible under the scoped root.
    expect(screen.getByText('bg')).toBeDefined();
    expect(screen.getByText('fg')).toBeDefined();
  });

  it('shows an empty-state message when the root matches no tokens', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <TokenNavigator root="does-not-exist" />
      </SwatchbookProvider>,
    );
    expect(screen.getByText(/No tokens under "does-not-exist"/)).toBeDefined();
  });
});
