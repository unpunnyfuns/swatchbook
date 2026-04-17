import { ShadowPreview } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/ShadowPreview',
  component: ShadowPreview,
  argTypes: {
    filter: { control: 'text' },
  },
});

export default meta;

export const SystemShadows = meta.story({ args: { filter: 'shadow.sys.*' } });
export const All = meta.story();
