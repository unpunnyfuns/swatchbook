/**
 * Shared setup for the four TokenNavigator keyboard-nav browser tests
 * (`-roving-tabindex`, `-arrow-navigation`, `-expand-collapse`,
 * `-activation`). Provides the snapshot fixture, the render wrapper
 * with knobs the tests care about, and the `treeItem(path)` lookup
 * that drives every assertion.
 */
import { render, screen, within } from '@testing-library/react';
import { type ProjectSnapshot, SwatchbookProvider, TokenNavigator } from '#/index.ts';

export function snapshot(): ProjectSnapshot {
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
    activePermutation: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

export function renderNav(
  props: { initiallyExpanded?: number; onSelect?: (p: string) => void } = {},
) {
  return render(
    <SwatchbookProvider value={snapshot()}>
      <TokenNavigator
        initiallyExpanded={props.initiallyExpanded ?? 0}
        searchable={false}
        {...(props.onSelect ? { onSelect: props.onSelect } : {})}
      />
    </SwatchbookProvider>,
  );
}

export function treeItem(path: string): HTMLLIElement {
  const tree = screen.getByRole('tree');
  const node = within(tree)
    .getAllByRole('treeitem')
    .find((el) => el.getAttribute('data-path') === path);
  if (!node) throw new Error(`treeitem at path "${path}" not found`);
  return node as HTMLLIElement;
}
