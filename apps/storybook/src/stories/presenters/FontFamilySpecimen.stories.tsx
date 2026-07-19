import { FontFamilySpecimen } from '@unpunnyfuns/swatchbook-blocks';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const fontFamilyBody: RealisedToken<'fontFamily'> = {
  $type: 'fontFamily',
  $value: ['Arial', 'sans-serif'],
};

const meta = preview.meta({
  title: 'Presenters/Specimen/FontFamilySpecimen',
  component: FontFamilySpecimen,
  args: { path: 'font.family.body', token: fontFamilyBody, colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({});
