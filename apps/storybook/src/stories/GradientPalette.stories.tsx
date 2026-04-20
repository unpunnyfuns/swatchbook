import { GradientPalette } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/GradientPalette',
  component: GradientPalette,
  argTypes: {
    filter: { control: 'text' },
  },
});

export default meta;

export const AllGradients = meta.story({
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const sample = canvasElement.querySelector('[aria-hidden="true"]');
      expect(sample, 'at least one gradient sample should render').not.toBeNull();
    });
  },
});
export const RefGradients = meta.story({ args: { filter: 'gradient.*' } });
