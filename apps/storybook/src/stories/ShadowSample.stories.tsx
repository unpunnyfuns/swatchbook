import { ShadowSample } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/Samples/ShadowSample',
  component: ShadowSample,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Default = meta.story({ args: { path: 'shadow.sys.md' } });
