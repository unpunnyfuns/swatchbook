import { StrokeSample } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const strokeDashed: RealisedToken<'strokeStyle'> = {
  $type: 'strokeStyle',
  $value: 'dashed',
};

const strokeCustom: RealisedToken<'strokeStyle'> = {
  $type: 'strokeStyle',
  $value: {
    dashArray: [
      { value: 4, unit: 'px' },
      { value: 2, unit: 'px' },
    ],
    lineCap: 'round',
  },
};

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so the stories' partial args stop resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Sample/StrokeSample',
  component: StrokeSample,
  args: { colorFormat },
});

export default meta;

export const Default = meta.story({ args: { path: 'stroke.style.dashed', token: strokeDashed } });
export const Custom = meta.story({ args: { path: 'stroke.style.custom', token: strokeCustom } });
