import { GradientSwatch } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const gradientBrand: RealisedToken<'gradient'> = {
  $type: 'gradient',
  $value: [
    { color: '#3b82f6', position: 0 },
    { color: '#8b5cf6', position: 1 },
  ],
};

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so `meta.story()` stops resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Swatch/GradientSwatch',
  component: GradientSwatch,
  args: { path: 'gradient.brand', token: gradientBrand, colorFormat },
});

export default meta;

export const Default = meta.story();
