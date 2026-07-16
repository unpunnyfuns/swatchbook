import { withAxes } from '@unpunnyfuns/swatchbook-addon/testing';
import { ColorTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, userEvent, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/ColorTable',
  component: ColorTable,
  // axe (a11y) runs once on the small RefBlue story. The full-table
  // variants re-check identical row patterns at 6-13s of axe each; that
  // load is what trips the addon-vitest manager UI server timeout
  // (#1212). Interaction tests still run on every story.
  parameters: { a11y: { test: 'off' } },
  argTypes: {
    filter: { control: 'text' },
    sortBy: {
      control: 'select',
      options: ['path', 'value', 'none'],
    },
    sortDir: {
      control: 'select',
      options: ['asc', 'desc'],
    },
    searchable: { control: 'boolean' },
  },
});

export default meta;

async function assertTableRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    const rows = canvas.querySelectorAll('[data-testid="color-table-row"]');
    expect(rows.length, 'ColorTable must render at least one row').toBeGreaterThan(0);
  });
}

export const All = meta.story({
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
export const SysOnly = meta.story({
  args: { filter: 'color.**' },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
export const RefBlue = meta.story({
  args: { filter: 'color.palette.blue.**' },
  parameters: { a11y: { test: 'error' } },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});

/**
 * Axis coverage for the a11y-enabled RefBlue story: the same small blue-palette
 * table re-rendered under two curated presets via `.extend`. Each generates its
 * own render + play + a11y test, so axe runs against dark surfaces and against
 * high-contrast borders, not only the default light baseline.
 */
export const RefBlueBrandADark = RefBlue.extend(withAxes('Brand A Dark'));
export const RefBlueHighContrast = RefBlue.extend(withAxes('A11y High Contrast'));

export const SortedPerceptually = meta.story({
  args: { sortBy: 'value' },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
export const GroupedVariants = meta.story({
  args: {
    filter: 'color.**',
    variants: { hover: 'hover' },
  },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});

/**
 * Row-click expansion — clicking a row toggles the inline detail
 * sub-row (hex / HSL / OKLCH breakdown, alias chain, description).
 * Closes the "ColorTable — no expansion play" gap from #704.
 */
export const ExpandsOnRowClick = meta.story({
  args: { filter: 'color.palette.blue.**' },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    await assertTableRenders(canvasElement);
    const firstRow = canvasElement.querySelector<HTMLElement>('[data-testid="color-table-row"]');
    if (!firstRow) throw new Error('expected at least one color row');

    expect(
      canvasElement.querySelectorAll('[data-testid="color-table-detail"]').length,
      'no detail rows visible before clicking',
    ).toBe(0);

    await userEvent.click(firstRow);
    await waitFor(() => {
      const detail = canvasElement.querySelector<HTMLElement>('[data-testid="color-table-detail"]');
      expect(detail, 'expanded detail row appears after click').toBeTruthy();
    });

    await userEvent.click(firstRow);
    await waitFor(() => {
      expect(
        canvasElement.querySelectorAll('[data-testid="color-table-detail"]').length,
        'click again collapses the detail row',
      ).toBe(0);
    });
  },
});
