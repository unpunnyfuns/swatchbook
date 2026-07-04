import { MotionPreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

// Composite ($type: transition) + primitives ($type: duration, cubicBezier).
// Respects prefers-reduced-motion. disableSnapshot avoids animated-frame churn
// in Chromatic.
const meta = preview.meta({
  title: 'Tokens/Motion',
  component: MotionPreview,
  parameters: { chromatic: { disableSnapshot: true } },
  argTypes: { filter: { control: 'text' } },
});

export default meta;

export const All = meta.story({
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(
        canvasElement.querySelector('[data-swatchbook-block]'),
        'block must render',
      ).toBeTruthy();
    });
  },
});
