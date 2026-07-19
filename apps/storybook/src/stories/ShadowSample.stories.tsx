import { ShadowSample } from '@unpunnyfuns/swatchbook-blocks';
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

const meta = preview.meta({
  title: 'Internals/Samples/ShadowSample',
  component: ShadowSample,
  args: { path: 'shadow.md', token: shadowMd, colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({});
