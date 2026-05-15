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
  parameters: { chromatic: { delay: 400 } },
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
export const SysColors = meta.story({ args: { filter: 'color.*' } });
export const SysTypography = meta.story({ args: { filter: 'typography.*' } });
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
export const FocusVisibleRow = meta.story({
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await assertTableRenders(canvasElement);
    const isFocusedRow = (): boolean => {
      const el = document.activeElement;
      return el?.tagName === 'TR' && el !== null && canvasElement.contains(el);
    };
    const tabUntilRow = async (remaining: number): Promise<void> => {
      if (isFocusedRow() || remaining <= 0) return;
      await userEvent.tab();
      await tabUntilRow(remaining - 1);
    };
    await tabUntilRow(20);
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

/**
 * Real-browser coverage for the DetailOverlay focus-trap shipped in
 * the #753 a11y slice. jsdom approximates focus order but doesn't
 * fully run the browser's tabbing model; this play test exercises
 * the trap in Chromium via Storybook Test's Playwright provider.
 *
 * Verifies:
 *   1. Opening the overlay moves focus inside the dialog.
 *   2. Tab cycles within the dialog (never escapes to the
 *      backgrounded table).
 *   3. Escape dismisses; focus returns to the row that opened it.
 */
export const OverlayFocusTrap = meta.story({
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await assertTableRenders(canvasElement);

    // Tab into the first row, activate to open the overlay.
    const tabToRow = async (remaining: number): Promise<HTMLElement | null> => {
      if (remaining <= 0) return null;
      const el = document.activeElement;
      if (el?.tagName === 'TR' && el instanceof HTMLElement && canvasElement.contains(el)) {
        return el;
      }
      await userEvent.tab();
      return tabToRow(remaining - 1);
    };
    const openerRow = await tabToRow(20);
    if (!openerRow) {
      throw new Error('expected to focus a row within 20 Tab presses');
    }
    await userEvent.keyboard('{Enter}');

    // Dialog opens — focus should move into the panel.
    const dialog = await waitFor(() => {
      const node = document.querySelector('[role="dialog"]');
      if (!(node instanceof HTMLElement)) {
        throw new Error('overlay dialog did not mount');
      }
      return node;
    });
    expect(dialog.contains(document.activeElement), 'focus must move into the dialog on open').toBe(
      true,
    );

    // Tab repeatedly — focus must stay inside the dialog every time
    // (the trap should bounce wrap-around hits back to the first
    // focusable; the background table must not receive focus). Each
    // Tab depends on the previous one's effect, so this has to be
    // sequential — recursive helper sidesteps the await-in-loop lint.
    const tabAndAssert = async (count: number, attempt: number): Promise<void> => {
      if (attempt > count) return;
      await userEvent.tab();
      expect(
        dialog.contains(document.activeElement),
        `Tab press ${attempt} escaped the dialog — focus landed at ${document.activeElement?.tagName}`,
      ).toBe(true);
      await tabAndAssert(count, attempt + 1);
    };
    await tabAndAssert(8, 1);

    // Dismiss via Esc; focus should restore to the opener row.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
    expect(document.activeElement, 'focus must restore to the row that opened the overlay').toBe(
      openerRow,
    );
  },
});
