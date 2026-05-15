import { TokenNavigator } from '@unpunnyfuns/swatchbook-blocks';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenNavigator',
  component: TokenNavigator,
  // Heavy data-driven DOM (full token tree, fuzzy-search index, lazy
  // per-type previews in the tree rows). Chromatic would otherwise
  // snapshot mid-settle and flag the story as unstable. A short delay
  // lets the render land before capture — capture-phase only.
  parameters: { chromatic: { delay: 400 } },
  argTypes: {
    root: { control: 'text' },
    type: { control: 'text' },
    initiallyExpanded: { control: { type: 'number', min: 0, max: 6 } },
  },
});

export default meta;

export const Default = meta.story();

export const ColorSubtree = meta.story({ args: { root: 'color' } });

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
