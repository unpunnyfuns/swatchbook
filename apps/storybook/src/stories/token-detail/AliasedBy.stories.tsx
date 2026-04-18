import { AliasedBy } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenDetail/AliasedBy',
  component: AliasedBy,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const RefNeutralZero = meta.story({ args: { path: 'color.ref.neutral.0' } });
export const RefBlue500 = meta.story({ args: { path: 'color.ref.blue.500' } });
