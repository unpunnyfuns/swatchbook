import { CompositePreview } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/CompositePreview',
  component: CompositePreview,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Color = meta.story({ args: { path: 'color.sys.accent.bg' } });
export const Shadow = meta.story({ args: { path: 'shadow.sys.md' } });
export const Border = meta.story({ args: { path: 'border.sys.default' } });
export const Transition = meta.story({ args: { path: 'motion.sys.enter' } });
export const Typography = meta.story({ args: { path: 'typography.sys.body' } });
export const Gradient = meta.story({ args: { path: 'gradient.ref.sunrise' } });
export const StrokeStyle = meta.story({ args: { path: 'stroke.ref.style.custom-dash' } });
