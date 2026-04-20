import { ShadowPreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/ShadowPreview',
  component: ShadowPreview,
  argTypes: {
    filter: { control: 'text' },
  },
});

export default meta;

export const SystemShadows = meta.story({
  args: { filter: 'shadow.*' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const samples = canvasElement.querySelectorAll('[aria-hidden="true"]');
      expect(samples.length, 'shadow preview must render at least one sample').toBeGreaterThan(0);
    });
  },
});
export const All = meta.story();
