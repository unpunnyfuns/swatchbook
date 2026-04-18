import { TokenUsageSnippet } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenDetail/TokenUsageSnippet',
  component: TokenUsageSnippet,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Color = meta.story({ args: { path: 'color.sys.accent.bg' } });
export const Space = meta.story({ args: { path: 'space.sys.md' } });
