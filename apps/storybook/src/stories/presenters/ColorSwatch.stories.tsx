import { ColorSwatch } from '@unpunnyfuns/swatchbook-blocks';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const colorPrimary: RealisedToken<'color'> = {
  $type: 'color',
  $value: { hex: '#3b82f6' },
  $description: 'Primary brand color.',
};

const meta = preview.meta({
  title: 'Presenters/Swatch/ColorSwatch',
  component: ColorSwatch,
  args: { path: 'color.brand.primary', token: colorPrimary, colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({});
