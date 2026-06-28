import { ShadowPreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

// Composite layer ($type: shadow).
const meta = preview.meta({
  title: 'Tokens/Shadows',
  component: ShadowPreview,
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
