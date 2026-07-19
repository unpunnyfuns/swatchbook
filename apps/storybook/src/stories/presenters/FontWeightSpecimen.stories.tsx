import { FontWeightSpecimen } from '@unpunnyfuns/swatchbook-blocks';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const fontWeightBold: RealisedToken<'fontWeight'> = {
  $type: 'fontWeight',
  $value: 700,
};

const meta = preview.meta({
  title: 'Presenters/Specimen/FontWeightSpecimen',
  component: FontWeightSpecimen,
  args: { path: 'font.weight.bold', token: fontWeightBold, colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({});
