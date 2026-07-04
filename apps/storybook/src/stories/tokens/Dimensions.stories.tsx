import { DimensionScale } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

// Primitive layer ($type: dimension). `visual` chooses length | radius | size.
const meta = preview.meta({
  title: 'Tokens/Dimensions',
  component: DimensionScale,
  parameters: { a11y: { test: 'off' } },
  argTypes: {
    filter: { control: 'text' },
    visual: { control: 'select', options: ['length', 'radius', 'size'] },
  },
});

export default meta;

async function assertRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    expect(canvas.querySelector('[data-swatchbook-block]'), 'block must render').toBeTruthy();
  });
}

export const Lengths = meta.story({
  parameters: { a11y: { test: 'error' } },
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});
