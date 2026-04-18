import { ColorPalette } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/ColorPalette',
  component: ColorPalette,
  argTypes: {
    filter: { control: 'text' },
    groupBy: { control: { type: 'number', min: 1, max: 5, step: 1 } },
  },
});

export default meta;

export const All = meta.story();
export const SysOnly = meta.story({ args: { filter: 'color.sys.*' } });
export const RefBlue = meta.story({ args: { filter: 'color.ref.blue.*' } });
export const Flat = meta.story({ args: { groupBy: 2 } });
