import { TokenUsageSnippet } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/TokenUsageSnippet',
  component: TokenUsageSnippet,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Color = meta.story({ args: { path: 'color.accent.bg' } });
export const Space = meta.story({ args: { path: 'space.md' } });
