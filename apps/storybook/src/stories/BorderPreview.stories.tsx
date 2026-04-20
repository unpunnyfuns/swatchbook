import { BorderPreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/BorderPreview',
  component: BorderPreview,
  argTypes: {
    filter: { control: 'text' },
  },
});

export default meta;

export const SystemBorders = meta.story({
  args: { filter: 'border.*' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const samples = canvasElement.querySelectorAll('[aria-hidden="true"]');
      expect(samples.length, 'border preview must render at least one sample').toBeGreaterThan(0);
    });
  },
});
export const All = meta.story();
