import { OpacitySwatch } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const opacityMuted: RealisedToken<'number'> = {
  $type: 'number',
  $value: 0.4,
};

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so `meta.story()` stops resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Swatch/OpacitySwatch',
  component: OpacitySwatch,
  args: { path: 'opacity.muted', token: opacityMuted, colorFormat },
});

export default meta;

export const Default = meta.story();
