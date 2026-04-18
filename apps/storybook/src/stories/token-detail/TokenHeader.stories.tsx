import { TokenHeader } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenDetail/TokenHeader',
  component: TokenHeader,
  argTypes: {
    path: { control: 'text' },
    heading: { control: 'text' },
  },
});

export default meta;

export const Default = meta.story({ args: { path: 'color.sys.accent.bg' } });
export const WithHeading = meta.story({
  args: { path: 'typography.sys.heading', heading: 'Heading typography' },
});
