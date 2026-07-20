import { FontWeightSpecimen } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const fontWeightBold: RealisedToken<'fontWeight'> = {
  $type: 'fontWeight',
  $value: 700,
};

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so `meta.story()` stops resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Specimen/FontWeightSpecimen',
  component: FontWeightSpecimen,
  args: { path: 'font.weight.bold', token: fontWeightBold, colorFormat },
});

export default meta;

export const Default = meta.story();
