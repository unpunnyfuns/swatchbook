import { ShadowSample } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const shadowMd: RealisedToken<'shadow'> = {
  $type: 'shadow',
  $value: {
    offsetX: { value: 0, unit: 'px' },
    offsetY: { value: 4, unit: 'px' },
    blur: { value: 8, unit: 'px' },
    spread: { value: 0, unit: 'px' },
    color: '#00000026',
  },
};

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so `meta.story()` stops resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Sample/ShadowSample',
  component: ShadowSample,
  args: { path: 'shadow.md', token: shadowMd, colorFormat },
});

export default meta;

export const Default = meta.story();
