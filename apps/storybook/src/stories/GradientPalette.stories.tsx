import { GradientPalette } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/GradientPalette',
  component: GradientPalette,
  argTypes: {
    filter: { control: 'text' },
  },
});

export default meta;

export const AllGradients = meta.story();
export const RefGradients = meta.story({ args: { filter: 'gradient.ref.*' } });
