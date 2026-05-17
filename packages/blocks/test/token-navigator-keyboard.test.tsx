/**
 * WAI-ARIA tree pattern keyboard nav for `TokenNavigator`. Runs in real
 * Chromium via vitest-browser so the assertions reflect what a real
 * keyboard user experiences: roving tabindex semantics, arrow-key
 * traversal in the live tab order, focus repair after expand /
 * collapse.
 */
import { userEvent } from '@vitest/browser/context';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ProjectSnapshot, SwatchbookProvider, TokenNavigator } from '#/index.ts';
import { withCellsShape } from './_snapshot-utils.ts';

afterEach(cleanup);

function snapshot(): ProjectSnapshot {
  return withCellsShape({
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    permutations: [{ name: 'Light', input: { theme: 'Light' }, sources: [] }],
    permutationsResolved: {
      Light: {
        'color.bg': { $type: 'color', $value: { hex: '#fff' } },
        'color.fg': { $type: 'color', $value: { hex: '#111' } },
        'color.palette.blue.500': { $type: 'color', $value: { hex: '#3b82f6' } },
        'radius.sm': { $type: 'dimension', $value: { value: 4, unit: 'px' } },
      },
    },
    activePermutation: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  });
}

function renderNav(props: { initiallyExpanded?: number; onSelect?: (p: string) => void } = {}) {
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

function treeItem(path: string): HTMLLIElement {
  const tree = screen.getByRole('tree');
  const node = within(tree)
    .getAllByRole('treeitem')
    .find((el) => el.getAttribute('data-path') === path);
  if (!node) throw new Error(`treeitem at path "${path}" not found`);
  return node as HTMLLIElement;
}

describe('TokenNavigator roving tabindex', () => {
  it('exposes exactly one treeitem with tabIndex=0; rest are -1', () => {
    renderNav();
    const tree = screen.getByRole('tree');
    const items = within(tree).getAllByRole('treeitem');
    const focusable = items.filter((el) => el.getAttribute('tabindex') === '0');
    expect(focusable.length).toBe(1);
    const detabbed = items.filter((el) => el.getAttribute('tabindex') === '-1');
    expect(detabbed.length).toBe(items.length - 1);
  });

  it('places the initial focus stop on the first visible treeitem', () => {
    renderNav();
    // With initiallyExpanded=0, top-level groups (color, radius) are
    // the only visible treeitems. `color` sorts first.
    expect(treeItem('color').getAttribute('tabindex')).toBe('0');
    expect(treeItem('radius').getAttribute('tabindex')).toBe('-1');
  });
});

describe('TokenNavigator arrow-key navigation', () => {
  it('Down moves focus to the next visible treeitem', async () => {
    renderNav();
    treeItem('color').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(treeItem('radius'));
    expect(treeItem('radius').getAttribute('tabindex')).toBe('0');
    expect(treeItem('color').getAttribute('tabindex')).toBe('-1');
  });

  it('Up moves focus to the previous visible treeitem', async () => {
    renderNav();
    treeItem('radius').focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(treeItem('color'));
  });

  it('Home jumps to the first treeitem; End jumps to the last', async () => {
    renderNav();
    treeItem('color').focus();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(treeItem('radius'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(treeItem('color'));
  });
});

describe('TokenNavigator expand / collapse via arrow keys', () => {
  it('Right on a collapsed group expands it; Right again steps into the first child', async () => {
    renderNav();
    treeItem('color').focus();
    expect(treeItem('color').getAttribute('aria-expanded')).toBe('false');
    await userEvent.keyboard('{ArrowRight}');
    expect(treeItem('color').getAttribute('aria-expanded')).toBe('true');
    // Focus stays on the group; the children mounted on this render.
    expect(document.activeElement).toBe(treeItem('color'));
    await userEvent.keyboard('{ArrowRight}');
    // First child of `color` is the `color.palette` group (groups
    // sort before leaves at the same depth).
    expect(document.activeElement).toBe(treeItem('color.palette'));
  });

  it('Left on an expanded group collapses it', async () => {
    renderNav({ initiallyExpanded: 1 });
    expect(treeItem('color').getAttribute('aria-expanded')).toBe('true');
    treeItem('color').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(treeItem('color').getAttribute('aria-expanded')).toBe('false');
    // Children gone; focus stays on the group.
    expect(document.activeElement).toBe(treeItem('color'));
  });

  it('Left on a leaf steps focus to the parent group', async () => {
    renderNav({ initiallyExpanded: 1 });
    treeItem('color.bg').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(treeItem('color'));
  });
});

describe('TokenNavigator activation', () => {
  it('Enter on a leaf fires onSelect with the path', async () => {
    const onSelect = vi.fn();
    renderNav({ initiallyExpanded: 1, onSelect });
    treeItem('color.bg').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('color.bg');
  });

  it('Space toggles a group (same effect as Right when collapsed, Left when expanded)', async () => {
    renderNav();
    treeItem('color').focus();
    expect(treeItem('color').getAttribute('aria-expanded')).toBe('false');
    await userEvent.keyboard(' ');
    expect(treeItem('color').getAttribute('aria-expanded')).toBe('true');
    await userEvent.keyboard(' ');
    expect(treeItem('color').getAttribute('aria-expanded')).toBe('false');
  });
});
