import { DimensionBar } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/Samples/DimensionBar',
  component: DimensionBar,
  argTypes: {
    path: { control: 'text' },
    kind: { control: { type: 'inline-radio' }, options: ['length', 'radius', 'size'] },
  },
});

export default meta;

export const SpaceMd = meta.story({ args: { path: 'space.sys.md' } });
export const SpaceLg = meta.story({ args: { path: 'space.sys.lg' } });
export const RadiusLg = meta.story({ args: { path: 'radius.sys.lg', kind: 'radius' } });
