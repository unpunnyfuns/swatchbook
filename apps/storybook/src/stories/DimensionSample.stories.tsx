import { DimensionSample } from '@unpunnyfuns/swatchbook-blocks';
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

const meta = preview.meta({
  title: 'Presenters/Sample/DimensionSample',
  component: DimensionSample,
  args: { colorFormat: 'hex' },
});

export default meta;

export const SpaceMd = meta.story({ args: { path: 'space.md', token: spaceMd } });
export const SpaceLg = meta.story({ args: { path: 'space.lg', token: spaceLg } });
export const RadiusLg = meta.story({
  args: { path: 'radius.lg', token: radiusLg, options: { visual: 'radius' } },
});
