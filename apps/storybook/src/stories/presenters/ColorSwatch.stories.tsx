import { ColorSwatch } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const colorPrimary: RealisedToken<'color'> = {
  $type: 'color',
  $value: { hex: '#3b82f6' },
  $description: 'Primary brand color.',
};

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so `meta.story()` stops resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Swatch/ColorSwatch',
  component: ColorSwatch,
  args: { path: 'color.brand.primary', token: colorPrimary, colorFormat },
});

export default meta;

export const Default = meta.story();
