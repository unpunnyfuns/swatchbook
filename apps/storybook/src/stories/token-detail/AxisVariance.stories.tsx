import { AxisVariance } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/AxisVariance',
  component: AxisVariance,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const AccentBg = meta.story({ args: { path: 'color.accent.bg' } });
export const SurfaceDefault = meta.story({ args: { path: 'color.surface.default' } });
