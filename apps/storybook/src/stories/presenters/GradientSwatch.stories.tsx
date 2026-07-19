import { GradientSwatch } from '@unpunnyfuns/swatchbook-blocks';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const gradientBrand: RealisedToken<'gradient'> = {
  $type: 'gradient',
  $value: [
    { color: '#3b82f6', position: 0 },
    { color: '#8b5cf6', position: 1 },
  ],
};

const meta = preview.meta({
  title: 'Presenters/Swatch/GradientSwatch',
  component: GradientSwatch,
  args: { path: 'gradient.brand', token: gradientBrand, colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({});
