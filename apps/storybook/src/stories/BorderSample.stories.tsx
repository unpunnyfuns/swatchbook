import { BorderSample } from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
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

// Widen to `ColorFormat`: a narrow literal makes the CSF factory infer a
// meta-args type its `.story()` overload can't see as covering the union
// arg, so the stories' partial args stop resolving.
const colorFormat: ColorFormat = 'hex';

const meta = preview.meta({
  title: 'Presenters/Sample/BorderSample',
  component: BorderSample,
  args: { colorFormat },
});

export default meta;

export const Default = meta.story({ args: { path: 'border.default', token: borderDefault } });
export const Focus = meta.story({ args: { path: 'border.focus', token: borderFocus } });
