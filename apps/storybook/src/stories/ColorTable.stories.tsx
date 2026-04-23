import { ColorTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
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
