import { TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenTable',
  component: TokenTable,
  argTypes: {
    filter: { control: 'text' },
    type: {
      control: 'select',
      options: [
        undefined,
        'color',
        'dimension',
        'fontFamily',
        'fontWeight',
        'duration',
        'cubicBezier',
        'typography',
        'shadow',
        'border',
        'transition',
      ],
    },
    showVar: { control: 'boolean' },
  },
});

export default meta;

export const All = meta.story();
export const ColorsOnly = meta.story({ args: { type: 'color' } });
export const SysColors = meta.story({ args: { filter: 'color.sys.*' } });
export const SysTypography = meta.story({ args: { filter: 'typography.sys.*' } });
export const DimensionsOnly = meta.story({ args: { type: 'dimension' } });
