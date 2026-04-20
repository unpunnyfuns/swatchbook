import { MotionPreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/MotionPreview',
  component: MotionPreview,
  argTypes: {
    filter: { control: 'text' },
  },
});

export default meta;

export const SystemTransitions = meta.story({
  args: { filter: 'transition.*' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const wrapper = canvasElement.querySelector('[data-sb-theme]');
      expect(wrapper?.textContent, 'motion preview should include at least one axis path').toMatch(
        /motion\./,
      );
    });
  },
});
export const Durations = meta.story({ args: { filter: 'duration.*' } });
export const Easings = meta.story({ args: { filter: 'easing.*' } });
export const All = meta.story();
