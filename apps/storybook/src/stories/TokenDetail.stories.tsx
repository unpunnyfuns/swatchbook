import { TokenDetail } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenDetail',
  component: TokenDetail,
  argTypes: {
    path: { control: 'text' },
    heading: { control: 'text' },
  },
});

export default meta;

export const SysSurface = meta.story({ args: { path: 'color.sys.surface.default' } });
export const SysAccent = meta.story({ args: { path: 'color.sys.text.accent' } });
export const ButtonBg = meta.story({ args: { path: 'cmp.button.bg' } });
export const SpaceMd = meta.story({ args: { path: 'space.sys.md' } });
export const TypographyBody = meta.story({ args: { path: 'typography.sys.body' } });
export const Missing = meta.story({ args: { path: 'color.does.not.exist' } });
