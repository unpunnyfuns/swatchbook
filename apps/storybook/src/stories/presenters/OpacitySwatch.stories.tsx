import { OpacitySwatch } from '@unpunnyfuns/swatchbook-blocks';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const opacityMuted: RealisedToken<'number'> = {
  $type: 'number',
  $value: 0.4,
};

const meta = preview.meta({
  title: 'Presenters/Swatch/OpacitySwatch',
  component: OpacitySwatch,
  args: { path: 'opacity.muted', token: opacityMuted, colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({});
