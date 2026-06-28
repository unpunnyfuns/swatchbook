import { StrokeStylePreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

// Primitive layer ($type: strokeStyle).
const meta = preview.meta({
  title: 'Tokens/StrokeStyles',
  component: StrokeStylePreview,
  argTypes: { filter: { control: 'text' } },
});

export default meta;

export const All = meta.story({
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(
        canvasElement.querySelector('[data-swatchbook-block]'),
        'block must render',
      ).toBeTruthy();
    });
  },
});
