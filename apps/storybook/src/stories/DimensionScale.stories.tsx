import { DimensionScale } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/DimensionScale',
  component: DimensionScale,
  argTypes: {
    filter: { control: 'text' },
    kind: { control: 'select', options: ['length', 'radius', 'size'] },
  },
});

export default meta;

export const SpaceSystem = meta.story({ args: { filter: 'space.sys.*' } });
export const RadiusSystem = meta.story({ args: { filter: 'radius.sys.*', kind: 'radius' } });
export const SizeReferencePx = meta.story({ args: { filter: 'size.ref.*', kind: 'size' } });
export const All = meta.story();
