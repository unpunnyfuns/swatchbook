import { FontFamilyPreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

// Primitive layer ($type: fontFamily).
const meta = preview.meta({
  title: 'Tokens/Fonts/FontFamily',
  component: FontFamilyPreview,
  parameters: { a11y: { test: 'off' } },
  argTypes: { filter: { control: 'text' }, sample: { control: 'text' } },
});

export default meta;

async function assertRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    expect(canvas.querySelector('[data-swatchbook-block]'), 'block must render').toBeTruthy();
  });
}

export const Families = meta.story({
  parameters: { a11y: { test: 'error' } },
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});
