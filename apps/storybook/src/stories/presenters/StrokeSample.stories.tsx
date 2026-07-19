import { StrokeSample } from '@unpunnyfuns/swatchbook-blocks';
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

const meta = preview.meta({
  title: 'Presenters/Sample/StrokeSample',
  component: StrokeSample,
  args: { colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({ args: { path: 'stroke.style.dashed', token: strokeDashed } });
export const Custom = meta.story({ args: { path: 'stroke.style.custom', token: strokeCustom } });
