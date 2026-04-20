import { MotionSample } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/Samples/MotionSample',
  component: MotionSample,
  argTypes: {
    path: { control: 'text' },
    speed: { control: { type: 'inline-radio' }, options: [0.25, 0.5, 1, 2] },
  },
});

export default meta;

export const Default = meta.story({ args: { path: 'transition.enter' } });
