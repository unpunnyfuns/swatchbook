import { ColorTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, userEvent, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/ColorTable',
  component: ColorTable,
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
  args: { filter: 'color.*' },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
export const RefBlue = meta.story({
  args: { filter: 'color.palette.blue.*' },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
export const SortedPerceptually = meta.story({
  args: { sortBy: 'value' },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
export const GroupedVariants = meta.story({
  args: {
    filter: 'color.*',
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
  args: { filter: 'color.palette.blue.*' },
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
