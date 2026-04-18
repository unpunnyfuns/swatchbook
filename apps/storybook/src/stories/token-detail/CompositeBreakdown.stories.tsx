import { CompositeBreakdown } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenDetail/CompositeBreakdown',
  component: CompositeBreakdown,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Typography = meta.story({ args: { path: 'typography.sys.heading' } });
export const Shadow = meta.story({ args: { path: 'shadow.sys.md' } });
export const Border = meta.story({ args: { path: 'border.sys.default' } });
export const Transition = meta.story({ args: { path: 'motion.sys.enter' } });
export const Gradient = meta.story({ args: { path: 'gradient.ref.sunrise' } });
