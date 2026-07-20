import { DimensionSample } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const spaceMd: RealisedToken<'dimension'> = {
  $type: 'dimension',
  $value: { value: 16, unit: 'px' },
};
const spaceLg: RealisedToken<'dimension'> = {
  $type: 'dimension',
  $value: { value: 32, unit: 'px' },
};
const radiusLg: RealisedToken<'dimension'> = {
  $type: 'dimension',
  $value: { value: 16, unit: 'px' },
};

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so the stories' partial args stop resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Sample/DimensionSample',
  component: DimensionSample,
  args: { colorFormat },
});

export default meta;

export const SpaceMd = meta.story({ args: { path: 'space.md', token: spaceMd } });
export const SpaceLg = meta.story({ args: { path: 'space.lg', token: spaceLg } });
export const RadiusLg = meta.story({
  args: { path: 'radius.lg', token: radiusLg, options: { visual: 'radius' } },
});
