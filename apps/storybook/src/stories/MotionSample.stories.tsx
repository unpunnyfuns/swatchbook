import { MotionSample } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const transitionEnter: RealisedToken<'transition'> = {
  $type: 'transition',
  $value: { duration: { value: 200, unit: 'ms' }, timingFunction: [0.2, 0, 0, 1] },
};

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so `meta.story()` stops resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Sample/MotionSample',
  component: MotionSample,
  args: { path: 'transition.enter', token: transitionEnter, colorFormat },
});

export default meta;

export const Default = meta.story();
