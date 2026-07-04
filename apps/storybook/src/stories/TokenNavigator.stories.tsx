import { SwatchbookProvider, TokenNavigator } from '@unpunnyfuns/swatchbook-blocks';
import type { ProjectSnapshot, VirtualTokenShape } from '@unpunnyfuns/swatchbook-blocks';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import preview from '#storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenNavigator',
  component: TokenNavigator,
  // Heavy data-driven DOM (full token tree, fuzzy-search index, lazy
  // per-type previews in the tree rows). Chromatic would otherwise
  // snapshot mid-settle and flag the story as unstable. A short delay
  // lets the render land before capture — capture-phase only.
  // axe (a11y) runs once on the small ColorSubtree story. The full-tree
  // variants re-check identical row patterns at 8-13s of axe each; that
  // load is what trips the addon-vitest manager UI server timeout
  // (#1212). Interaction tests still run on every story.
  parameters: { chromatic: { delay: 400 }, a11y: { test: 'off' } },
  argTypes: {
    root: { control: 'text' },
    type: { control: 'text' },
    initiallyExpanded: { control: { type: 'number', min: 0, max: 6 } },
  },
});

export default meta;

export const Default = meta.story();

export const ColorSubtree = meta.story({
  args: { root: 'color' },
  parameters: { a11y: { test: 'error' } },
});

export const FullyCollapsed = meta.story({ args: { initiallyExpanded: 0 } });

export const DeepExpanded = meta.story({ args: { initiallyExpanded: 3, root: 'color' } });

/**
 * `type` scopes the tree by DTCG `$type`. Passing a single string restricts
 * to one type; passing an array narrows to a small-multiples view. Composes
 * with `root` — both constraints must hold.
 */
export const ColorTypeFilter = meta.story({ args: { type: 'color' } });

export const MotionTypes = meta.story({
  args: { type: ['duration', 'cubicBezier', 'transition'], initiallyExpanded: 2 },
});

/**
 * Empty-state render for a `root` / `type` arg that matches no tokens.
 * Exercises the path where the component's early return fires after every
 * hook has run — a shape that's easy to regress on if a hook gets added
 * below the empty-state guard.
 */
export const NoMatches = meta.story({
  args: { root: 'does-not-exist' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      if (!canvasElement.textContent?.includes('No tokens under "does-not-exist"')) {
        throw new Error('expected empty-state caption for a nonexistent root');
      }
    });
  },
});

function RecordingNavigator() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div>
      <div
        data-testid="custom-select-record"
        style={{ padding: 8, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
      >
        Last selected: {last ?? '(none)'}
      </div>
      <TokenNavigator root="color" onSelect={(p) => setLast(p)} />
    </div>
  );
}

export const CustomSelect = meta.story({
  render: () => <RecordingNavigator />,
});

/**
 * Play-function smoke test: expand a collapsed group, confirm descendant
 * leaves render, then click a leaf and confirm the detail overlay opens.
 */
export const ExpandAndOpenDetail = meta.story({
  args: { initiallyExpanded: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The treeitem <li> owns focus + keyboard nav (roving tabindex);
    // the inner row div owns click. Clicks must target the row div —
    // synthetic clicks dispatched at the <li> directly bubble up but
    // never propagate down to its child row.
    const groupRowFor = (path: string): HTMLElement | null => {
      const group = canvasElement.querySelector<HTMLElement>(
        `[data-testid="token-navigator-group"][data-path="${path}"]`,
      );
      return group?.querySelector<HTMLElement>('[data-testid="token-navigator-group-row"]') ?? null;
    };

    // 1. Expand the "color" top-level group.
    await waitFor(() => {
      const row = groupRowFor('color');
      if (!row) throw new Error('color group not in DOM yet');
    });
    const colorRow = groupRowFor('color');
    expect(colorRow).not.toBeNull();
    if (!colorRow) return;
    await userEvent.click(colorRow);

    // 2. Recursively drill into the first unexpanded color.* group until a
    // leaf appears. The reference fixture nests color tokens several levels
    // deep, so we drill rather than hard-coding a path.
    const drill = async (depth: number): Promise<void> => {
      if (depth <= 0) return;
      if (canvasElement.querySelector('[data-testid="token-navigator-leaf"]')) return;
      const collapsed = [
        ...canvasElement.querySelectorAll<HTMLElement>(
          '[data-testid="token-navigator-group"][data-path^="color."]',
        ),
      ].find((el) => el.getAttribute('aria-expanded') !== 'true');
      if (!collapsed) return;
      const targetPath = collapsed.getAttribute('data-path');
      const row = collapsed.querySelector<HTMLElement>('[data-testid="token-navigator-group-row"]');
      if (!row) throw new Error(`no row for ${targetPath}`);
      await userEvent.click(row);
      // Wait for the click's state update to land in the DOM before the
      // next iteration queries — otherwise we can pick the same group
      // again on the next pass and toggle it shut.
      await waitFor(() => {
        const after = canvasElement.querySelector<HTMLElement>(
          `[data-testid="token-navigator-group"][data-path="${targetPath}"]`,
        );
        if (after?.getAttribute('aria-expanded') !== 'true') {
          throw new Error('expansion did not land');
        }
      });
      await drill(depth - 1);
    };
    await drill(8);

    await waitFor(() => {
      const leaf = canvasElement.querySelector<HTMLElement>('[data-testid="token-navigator-leaf"]');
      if (!leaf) throw new Error('no leaf rendered after expansion');
    });
    const leaf = canvasElement.querySelector<HTMLElement>('[data-testid="token-navigator-leaf"]');
    expect(leaf).not.toBeNull();
    if (!leaf) return;
    const leafRow = leaf.querySelector<HTMLElement>('[data-testid="token-navigator-leaf-row"]');
    expect(leafRow).not.toBeNull();
    if (!leafRow) return;
    await userEvent.click(leafRow);

    // 3. Overlay opens.
    const overlay = await canvas.findByTestId('token-navigator-overlay');
    expect(overlay).toBeDefined();

    // 4. Close via the close button.
    const close = await canvas.findByTestId('token-navigator-overlay-close');
    await userEvent.click(close);

    await waitFor(() => {
      const stillThere = canvasElement.querySelector('[data-testid="token-navigator-overlay"]');
      if (stillThere) throw new Error('overlay did not close');
    });
  },
});

/**
 * `onSelect` suppresses the overlay and fires with the leaf's full dot-path.
 */
export const OnSelectFires = meta.story({
  render: () => <RecordingNavigator />,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const leaf = canvasElement.querySelector('[data-testid="token-navigator-leaf"]');
      if (!leaf) throw new Error('no leaf rendered');
    });
    const leaf = canvasElement.querySelector<HTMLElement>('[data-testid="token-navigator-leaf"]');
    expect(leaf).not.toBeNull();
    if (!leaf) return;
    const leafPath = leaf.getAttribute('data-path');
    expect(leafPath).toBeTruthy();
    const leafRow = leaf.querySelector<HTMLElement>('[data-testid="token-navigator-leaf-row"]');
    expect(leafRow).not.toBeNull();
    if (!leafRow) return;
    await userEvent.click(leafRow);

    const record = canvasElement.querySelector<HTMLElement>('[data-testid="custom-select-record"]');
    expect(record?.textContent).toContain(leafPath ?? '');

    // And the overlay must not have opened.
    const overlay = canvasElement.querySelector('[data-testid="token-navigator-overlay"]');
    expect(overlay).toBeNull();
  },
});

/**
 * Pre-1.0 a11y blocker (#696). Group-row + leaf-row have `role="button"` +
 * `tabIndex={0}` + `onKeyDown`; verify the `:focus-visible` rule paints a
 * non-zero outline. Chromatic skips this one — the focus state is asserted
 * via computed style, not pixels.
 */
export const FocusVisibleRow = meta.story({
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const group = canvasElement.querySelector('[data-testid="token-navigator-group"]');
      if (!group) throw new Error('navigator did not render any group rows');
    });
    // Seed focus on the search input (always tabbable, always present),
    // then Tab once. The next stop is the single treeitem holding the
    // roving tabindex=0. Going via Tab — rather than `.focus()` —
    // matters: `:focus-visible` is keyboard-only by design, so a
    // programmatic focus may not paint the outline in Blink.
    const search = canvasElement.querySelector<HTMLInputElement>(
      '[data-testid="token-navigator-search"]',
    );
    expect(search, 'search input must render so Tab traversal has a known anchor').not.toBeNull();
    if (!search) return;
    search.focus();
    await userEvent.tab();

    const focused = document.activeElement;
    if (
      !(focused instanceof HTMLElement) ||
      focused.tagName !== 'LI' ||
      focused.getAttribute('role') !== 'treeitem'
    ) {
      throw new Error(
        `expected first Tab after search input to focus the roving treeitem <li>; got ${focused?.tagName}`,
      );
    }
    const computed = getComputedStyle(focused);
    expect(computed.outlineStyle, 'focus-visible row outline must be solid (not none)').toBe(
      'solid',
    );
    expect(
      Number.parseFloat(computed.outlineWidth),
      'focus-visible row outline-width must be > 0',
    ).toBeGreaterThan(0);
  },
});

// Deterministic token map used by the Indicators story. Covers every
// indicator variant: multi-hop forward chain (3 hops → first … last cap),
// reverse count ≥ 2 (opens a popover menu), out-of-gamut color (display-P3
// red outside sRGB), string-form deprecation, and boolean-form deprecation.
const INDICATOR_TOKENS: Record<string, VirtualTokenShape> = {
  // Semantic alias — three-hop chain: text.primary → brand.fg → palette.blue.600 → palette.blue.500
  'color.text.primary': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0.11, 0.44, 0.95], alpha: 1 },
    aliasOf: 'color.brand.fg',
    aliasChain: ['color.brand.fg', 'color.palette.blue.600', 'color.palette.blue.500'],
  },
  // Intermediate alias node
  'color.brand.fg': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0.11, 0.44, 0.95], alpha: 1 },
    aliasOf: 'color.palette.blue.600',
    aliasChain: ['color.palette.blue.600', 'color.palette.blue.500'],
  },
  // Another intermediate
  'color.palette.blue.600': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0.11, 0.44, 0.95], alpha: 1 },
    aliasOf: 'color.palette.blue.500',
    aliasChain: ['color.palette.blue.500'],
  },
  // Primitive — referenced by two tokens, so the reverse button opens a menu.
  'color.palette.blue.500': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0.23, 0.51, 0.97], alpha: 1 },
    aliasedBy: ['color.text.primary', 'color.border.focus'],
  },
  // Second reverse referent so the blue.500 count shows ← 2.
  'color.border.focus': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0.23, 0.51, 0.97], alpha: 1 },
    aliasOf: 'color.palette.blue.500',
    aliasChain: ['color.palette.blue.500'],
  },
  // Out-of-gamut: display-P3 primary red lies outside sRGB, triggering ⚠.
  'color.accent.vivid': {
    $type: 'color',
    $value: { colorSpace: 'display-p3', components: [1, 0, 0], alpha: 1 },
  },
  // Deprecated with a guidance message (string form).
  'color.legacy.brand': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0.8, 0.2, 0.1], alpha: 1 },
    $deprecated: 'use color.text.primary instead',
  },
  // Deprecated without a message (boolean form).
  'color.legacy.neutral': {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: [0.5, 0.5, 0.5], alpha: 1 },
    $deprecated: true,
  },
};

// Module-level snapshot so its identity is stable across re-renders.
// A new object per render would invalidate the `resolved` memo inside
// `useProject`, causing `tree` → `initialExpanded` to churn identity,
// which trips the re-seed effect and loops: setExpanded → re-render → …
const INDICATORS_SNAPSHOT: ProjectSnapshot = (() => {
  const snap: ProjectSnapshot = {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = () => INDICATOR_TOKENS;
  return snap;
})();

/**
 * Row indicator strip smoke test. Wraps the navigator in a local
 * `SwatchbookProvider` so the token set is deterministic, independent of
 * the reference project loaded by the global decorator.
 *
 * Covers: multi-hop forward alias chain (capped to first → … → last),
 * reverse-reference count that opens a popover menu (≥ 2 referents),
 * out-of-gamut glyph (display-P3 red), string-form deprecation badge, and
 * boolean-form deprecation badge.
 *
 * The variance badge is absent here: `varianceByPath` only populates from
 * a real loaded project, not a hand-built snapshot. Variance already
 * renders on `Default` and `ColorSubtree` with the real project data.
 */
export const Indicators = meta.story({
  render: () => (
    <SwatchbookProvider value={INDICATORS_SNAPSHOT}>
      {/*
        Give the navigator a unique `id` so its `usePersistedState` block key
        doesn't collide with sibling stories that share the same `root`/`type`
        defaults. Without an `id`, every un-rooted navigator story persists
        its expand/collapse state under the same key and the state from
        FullyCollapsed (or any prior run) bleeds in here, leaving groups
        collapsed so leaf rows never appear.
      */}
      <TokenNavigator id="indicators" initiallyExpanded={6} />
    </SwatchbookProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the tree to settle. Because `usePersistedState` reads from a
    // module-level store that persists between story runs, even with the
    // unique `id` above a warm run may restore a collapsed state from a
    // previous iteration of this story. Expand all top-level groups
    // explicitly so the leaf rows are guaranteed visible regardless.
    await waitFor(() => {
      if (!canvasElement.querySelector('[data-testid="token-navigator-group"]')) {
        throw new Error('token navigator did not render any group rows');
      }
    });

    // Expand all collapsed groups, one at a time, until none remain.
    // Recursive so the lint rule (`no-await-in-loop`) is avoided: we pick the
    // first collapsed group, expand it, wait for the state change, then recurse.
    const expandOne = async (): Promise<void> => {
      const collapsed = canvasElement.querySelector<HTMLElement>(
        '[data-testid="token-navigator-group"][aria-expanded="false"]',
      );
      if (!collapsed) return;
      const row = collapsed.querySelector<HTMLElement>('[data-testid="token-navigator-group-row"]');
      if (!row) return;
      await userEvent.click(row);
      await waitFor(() => {
        if (collapsed.getAttribute('aria-expanded') !== 'true') {
          throw new Error('group did not expand');
        }
      });
      await expandOne();
    };
    await expandOne();

    await waitFor(() => {
      if (!canvasElement.querySelector('[data-testid="token-navigator-leaf"]')) {
        throw new Error('tree did not render any leaf rows after expanding all groups');
      }
    });

    // 1. The three-hop forward chain renders on color.text.primary. Find it by
    // the leaf row's data-path attribute so there's no ambiguity across the
    // multiple alias-forward indicators in the tree.
    const textPrimaryLeaf = canvasElement.querySelector<HTMLElement>(
      '[data-testid="token-navigator-leaf"][data-path="color.text.primary"]',
    );
    expect(textPrimaryLeaf, 'color.text.primary leaf must be in the DOM').not.toBeNull();
    if (!textPrimaryLeaf) throw new Error('color.text.primary leaf not found');

    const forwardStrip = textPrimaryLeaf.querySelector<HTMLElement>(
      '[data-testid="row-indicator-alias-forward"]',
    );
    expect(
      forwardStrip,
      'forward alias chain must be present on color.text.primary',
    ).not.toBeNull();
    if (!forwardStrip)
      throw new Error('row-indicator-alias-forward not found on color.text.primary');

    // 2. The three-hop chain is capped to first → … → last. Both nodes should
    // be navigable buttons (color.brand.fg and color.palette.blue.500).
    const aliasNodes = forwardStrip.querySelectorAll<HTMLElement>('[data-testid="alias-node"]');
    expect(aliasNodes.length, 'capped chain shows two alias nodes (first + last)').toBe(2);

    // Click the first node — navigates to color.brand.fg (already in the tree).
    const firstNode = aliasNodes[0];
    if (!firstNode) throw new Error('no alias-node found inside forward chain');
    await userEvent.click(firstNode);
    // After navigation, color.brand.fg is selected (overlay opens or row gains
    // selected state). The leaf row is already in the DOM; just assert it exists.
    await waitFor(() => {
      const target = canvasElement.querySelector(
        '[data-testid="token-navigator-leaf"][data-path="color.brand.fg"]',
      );
      if (!target) throw new Error('color.brand.fg leaf row missing after alias navigation');
    });

    // 3. The reverse count for color.palette.blue.500 shows ← 2 and opens a menu.
    const blue500Leaf = canvasElement.querySelector<HTMLElement>(
      '[data-testid="token-navigator-leaf"][data-path="color.palette.blue.500"]',
    );
    expect(blue500Leaf, 'color.palette.blue.500 leaf must be in the DOM').not.toBeNull();
    if (!blue500Leaf) throw new Error('color.palette.blue.500 leaf not found');

    const reverseBtn = blue500Leaf.querySelector<HTMLElement>(
      '[data-testid="row-indicator-alias-reverse"]',
    );
    expect(reverseBtn, 'reverse count button must be on the blue.500 leaf row').not.toBeNull();
    if (!reverseBtn) throw new Error('row-indicator-alias-reverse not found on blue.500');
    expect(reverseBtn.getAttribute('aria-label')).toBe('referenced by 2 tokens');
    await userEvent.click(reverseBtn);

    // Menu should now contain one item per referent.
    const menuItems = await canvas.findAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThanOrEqual(2);
    const itemPaths = menuItems.map((el) => el.textContent?.trim());
    expect(itemPaths).toContain('color.text.primary');
    expect(itemPaths).toContain('color.border.focus');
  },
});
