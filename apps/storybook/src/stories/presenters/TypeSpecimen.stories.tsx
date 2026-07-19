import { TypeSpecimen } from '@unpunnyfuns/swatchbook-blocks';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import preview from '#storybook/preview.tsx';

const typographyHeading: RealisedToken<'typography'> = {
  $type: 'typography',
  $value: {
    fontFamily: 'Inter',
    fontSize: { value: 24, unit: 'px' },
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: { value: 0.5, unit: 'px' },
  },
};

const meta = preview.meta({
  title: 'Presenters/Specimen/TypeSpecimen',
  component: TypeSpecimen,
  args: { path: 'typography.heading', token: typographyHeading, colorFormat: 'hex' },
});

export default meta;

export const Default = meta.story({});
