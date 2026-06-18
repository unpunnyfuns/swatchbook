import { TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, userEvent, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenTable',
  component: TokenTable,
  // Heavy data-driven DOM settles asynchronously (fuzzy-search index,
  // font metrics, the row-level lazy swatch cells). Chromatic would
  // otherwise snapshot mid-settle and flag the story as unstable. A
  // short delay lets the render land before capture — capture-phase
  // only, doesn't touch local dev or vitest.
  // axe (a11y) runs once on the small SysColors story. The full-table
  // variants re-check identical row patterns at 7-14s of axe each; that
  // load is what trips the addon-vitest manager UI server timeout
  // (#1212). Interaction tests still run on every story.
  parameters: { chromatic: { delay: 400 }, a11y: { test: 'off' } },
  argTypes: {
    filter: { control: 'text' },
    type: {
      control: 'select',
      options: [
        undefined,
        'color',
        'dimension',
        'fontFamily',
        'fontWeight',
        'duration',
        'cubicBezier',
        'typography',
        'shadow',
        'border',
        'transition',
      ],
    },
  },
});

export default meta;

async function assertTableRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    const rows = canvas.querySelectorAll('tbody tr');
    expect(rows.length, 'table must render at least one row').toBeGreaterThan(0);
  });
}

export const All = meta.story({
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
export const ColorsOnly = meta.story({
  args: { type: 'color' },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
export const SysColors = meta.story({
  args: { filter: 'color.**' },
  parameters: { a11y: { test: 'error' } },
});
export const SysTypography = meta.story({ args: { filter: 'typography.**' } });
export const DimensionsOnly = meta.story({
  args: { type: 'dimension' },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});

/**
 * Pre-1.0 a11y blocker (#696). Rows have `tabIndex={0}` + click handler;
 * verify the `:focus-visible` rule paints a non-zero outline so keyboard
 * users get an "I am here" indicator. Chromatic skips this one — the
 * focus state is asserted via computed style, not pixels.
 */
/**
 * Search-input interaction — type a substring and the visible row set
 * narrows to matching paths. Closes the "TokenTable — only render
 * smoke, no search/sort play" gap from #704. The component-level
 * coverage in `packages/blocks/test/token-table.test.tsx` already
 * tests the underlying logic; this play function verifies the same
 * contract end-to-end through the actual Storybook preview pipeline
 * (decorator → snapshot → block render → user input).
 */
export const SearchFilters = meta.story({
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await assertTableRenders(canvasElement);
    const search = canvasElement.querySelector<HTMLInputElement>(
      '[data-testid="token-table-search"]',
    );
    if (!search) throw new Error('search input missing');

    const visibleRowCount = (): number =>
      canvasElement.querySelectorAll<HTMLElement>('[data-testid="token-table-row"]').length;
    const before = visibleRowCount();
    expect(before, 'table should have multiple rows before filtering').toBeGreaterThan(2);

    await userEvent.type(search, 'surface');
    await waitFor(() => {
      const visible = canvasElement.querySelectorAll<HTMLElement>(
        '[data-testid="token-table-row"]',
      );
      expect(visible.length, 'search should narrow row count').toBeLessThan(before);
      expect(visible.length, 'at least one row matches "surface"').toBeGreaterThan(0);
      for (const row of visible) {
        expect(row.getAttribute('data-path') ?? '').toContain('surface');
      }
    });

    // Clear and verify it un-narrows. `userEvent.clear` would be cleaner
    // but isn't on every userEvent flavor; triple-click + delete is the
    // portable form.
    await userEvent.tripleClick(search);
    await userEvent.keyboard('{Delete}');
    await waitFor(() => {
      expect(visibleRowCount()).toBe(before);
    });
  },
});

/**
 * Alias-forward indicators are interactive: clicking an alias node opens the
 * detail overlay for the referenced token. This story finds the first forward
 * indicator in the live dogfood table, clicks its alias node, and confirms the
 * detail dialog appears.
 */
export const Indicators = meta.story({
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await assertTableRenders(canvasElement);
    const forwardIndicator = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>(
        '[data-testid="row-indicator-alias-forward"]',
      );
      if (!el) throw new Error('no alias-forward indicator found in the table');
      return el;
    });
    const aliasNode = forwardIndicator.querySelector<HTMLElement>('[data-testid="alias-node"]');
    if (!aliasNode) throw new Error('no alias-node button inside the forward indicator');
    await userEvent.click(aliasNode);
    await waitFor(() => {
      const dialog = canvasElement.ownerDocument.querySelector('[role="dialog"]');
      expect(dialog, 'detail overlay dialog must open after clicking alias node').toBeTruthy();
    });
  },
});

export const FocusVisibleRow = meta.story({
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await assertTableRenders(canvasElement);
    // Focus the first row directly — alias-node buttons inside rows now
    // consume additional tab stops, making blind tab-counting fragile.
    // Programmatic focus still triggers :focus-visible when userEvent has
    // primed keyboard mode via a preceding tab.
    const firstRow = canvasElement.querySelector<HTMLElement>('[data-testid="token-table-row"]');
    if (!firstRow) throw new Error('no token-table-row found');
    await userEvent.tab();
    firstRow.focus();
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement) || focused.tagName !== 'TR') {
      throw new Error(`expected a tbody row to receive keyboard focus; got ${focused?.tagName}`);
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
