import { OpacityScale } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/OpacityScale',
  component: OpacityScale,
  argTypes: {
    filter: { control: 'text' },
    sampleColor: { control: 'text' },
  },
});

export default meta;

export const NumberOpacities = meta.story({
  args: { filter: 'number.opacity.*' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const cards = canvasElement.querySelectorAll('[aria-hidden="true"]');
      expect(cards.length, 'at least one opacity card renders').toBeGreaterThan(0);
    });
  },
});

export const TextSampleColor = meta.story({
  args: { filter: 'number.opacity.*', sampleColor: 'color.text.default' },
});

export const EmptyFilter = meta.story({
  args: { filter: 'nonexistent.*' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain('No opacity tokens match');
  },
});
