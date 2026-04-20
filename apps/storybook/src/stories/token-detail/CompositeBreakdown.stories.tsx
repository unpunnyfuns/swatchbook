import { CompositeBreakdown } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/CompositeBreakdown',
  component: CompositeBreakdown,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Typography = meta.story({ args: { path: 'typography.heading' } });
export const Shadow = meta.story({ args: { path: 'shadow.md' } });
export const Border = meta.story({ args: { path: 'border.default' } });
export const Transition = meta.story({ args: { path: 'transition.enter' } });
export const Gradient = meta.story({ args: { path: 'gradient.sunrise' } });
