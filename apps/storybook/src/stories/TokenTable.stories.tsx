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
