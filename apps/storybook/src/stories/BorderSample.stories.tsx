import { BorderSample } from '@unpunnyfuns/swatchbook-blocks';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const borderDefault: RealisedToken<'border'> = {
  $type: 'border',
  $value: { width: { value: 1, unit: 'px' }, style: 'solid', color: '#00000026' },
};

const borderFocus: RealisedToken<'border'> = {
  $type: 'border',
  $value: { width: { value: 2, unit: 'px' }, style: 'solid', color: '#0066ff' },
};

const meta = preview.meta({
  title: 'Presenters/Sample/BorderSample',
  component: BorderSample,
  args: { colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({ args: { path: 'border.default', token: borderDefault } });
export const Focus = meta.story({ args: { path: 'border.focus', token: borderFocus } });
