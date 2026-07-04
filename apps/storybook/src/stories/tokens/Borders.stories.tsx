import { BorderPreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

// Composite layer ($type: border).
const meta = preview.meta({
  title: 'Tokens/Borders',
  component: BorderPreview,
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
