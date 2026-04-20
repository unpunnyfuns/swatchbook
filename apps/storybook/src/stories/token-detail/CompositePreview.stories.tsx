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

export const Color = meta.story({ args: { path: 'color.accent.bg' } });
export const Shadow = meta.story({ args: { path: 'shadow.md' } });
export const Border = meta.story({ args: { path: 'border.default' } });
export const Transition = meta.story({ args: { path: 'transition.enter' } });
export const Typography = meta.story({ args: { path: 'typography.body' } });
export const Gradient = meta.story({ args: { path: 'gradient.sunrise' } });
export const StrokeStyle = meta.story({ args: { path: 'stroke.style.custom-dash' } });
