import { BorderSample } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/Samples/BorderSample',
  component: BorderSample,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Default = meta.story({ args: { path: 'border.default' } });
export const Focus = meta.story({ args: { path: 'border.focus' } });
