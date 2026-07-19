import { MotionSample } from '@unpunnyfuns/swatchbook-blocks';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const transitionEnter: RealisedToken<'transition'> = {
  $type: 'transition',
  $value: { duration: { value: 200, unit: 'ms' }, timingFunction: [0.2, 0, 0, 1] },
};

const meta = preview.meta({
  title: 'Internals/Samples/MotionSample',
  component: MotionSample,
  args: { path: 'transition.enter', token: transitionEnter, colorFormat: 'hex' },
  argTypes: {
    speed: { control: { type: 'inline-radio' }, options: [0.25, 0.5, 1, 2] },
  },
});

export default meta;

export const Default = meta.story({});
