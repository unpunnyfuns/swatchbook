import { TypographyScale } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TypographyScale',
  component: TypographyScale,
  argTypes: {
    filter: { control: 'text' },
    sample: { control: 'text' },
  },
});

export default meta;

export const All = meta.story({
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const wrapper = canvasElement.querySelector('[data-sb-theme]');
      expect(
        wrapper?.textContent,
        'typography scale should include at least one typography path',
      ).toMatch(/typography\./);
    });
  },
});
export const HeadingOnly = meta.story({ args: { filter: 'typography.sys.heading' } });
export const Pangram = meta.story({
  args: { sample: 'Sphinx of black quartz, judge my vow — 0123456789' },
});
