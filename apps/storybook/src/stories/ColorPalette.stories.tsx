import { ColorPalette } from '@unpunnyfuns/swatchbook-blocks';
import { waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/ColorPalette',
  component: ColorPalette,
  // axe (a11y) runs once on the small RefBlue story. The full-palette
  // variants re-check identical swatch patterns at ~6s of axe each; that
  // load is what trips the addon-vitest manager UI server timeout
  // (#1212). Interaction tests still run on every story.
  parameters: { a11y: { test: 'off' } },
  argTypes: {
    filter: { control: 'text' },
    groupBy: { control: { type: 'number', min: 1, max: 5, step: 1 } },
  },
});

export default meta;

async function assertPaletteRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    const section = canvas.querySelector('section');
    if (!section) throw new Error('palette section not found');
  });
}

export const All = meta.story({
  play: async ({ canvasElement }) => assertPaletteRenders(canvasElement),
});
export const SysOnly = meta.story({
  args: { filter: 'color.**' },
  play: async ({ canvasElement }) => assertPaletteRenders(canvasElement),
});
export const RefBlue = meta.story({
  args: { filter: 'color.palette.blue.**' },
  parameters: { a11y: { test: 'error' } },
  play: async ({ canvasElement }) => assertPaletteRenders(canvasElement),
});
export const Flat = meta.story({ args: { groupBy: 2 } });
