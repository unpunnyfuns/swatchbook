import { BorderPreview } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/BorderPreview',
  component: BorderPreview,
  argTypes: {
    filter: { control: 'text' },
  },
});

export default meta;

export const SystemBorders = meta.story({ args: { filter: 'border.sys.*' } });
export const All = meta.story();
