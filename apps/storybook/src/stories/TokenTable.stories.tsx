import { TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenTable',
  component: TokenTable,
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
    showVar: { control: 'boolean' },
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
export const SysColors = meta.story({ args: { filter: 'color.sys.*' } });
export const SysTypography = meta.story({ args: { filter: 'typography.sys.*' } });
export const DimensionsOnly = meta.story({
  args: { type: 'dimension' },
  play: async ({ canvasElement }) => assertTableRenders(canvasElement),
});
