import { DimensionSample } from '@unpunnyfuns/swatchbook-blocks';
import preview from '#storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/Samples/DimensionSample',
  component: DimensionSample,
  argTypes: {
    path: { control: 'text' },
    visual: { control: { type: 'inline-radio' }, options: ['length', 'radius', 'size'] },
  },
});

export default meta;

export const SpaceMd = meta.story({ args: { path: 'space.md' } });
export const SpaceLg = meta.story({ args: { path: 'space.lg' } });
export const RadiusLg = meta.story({ args: { path: 'radius.lg', visual: 'radius' } });
