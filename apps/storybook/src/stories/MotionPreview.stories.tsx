import { MotionPreview } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/MotionPreview',
  component: MotionPreview,
  argTypes: {
    filter: { control: 'text' },
  },
});

export default meta;

export const SystemTransitions = meta.story({ args: { filter: 'motion.sys.*' } });
export const Durations = meta.story({ args: { filter: 'duration.*' } });
export const Easings = meta.story({ args: { filter: 'easing.*' } });
export const All = meta.story();
