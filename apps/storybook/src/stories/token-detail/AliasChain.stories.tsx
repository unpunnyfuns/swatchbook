import { AliasChain } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/AliasChain',
  component: AliasChain,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const AccentBg = meta.story({ args: { path: 'color.accent.bg' } });
export const SpaceMd = meta.story({ args: { path: 'space.md' } });
