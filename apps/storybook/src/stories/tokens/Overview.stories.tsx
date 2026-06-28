import { TokenNavigator } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

// Cross-type catalog: the whole token graph as a searchable tree. Heavy DOM,
// so chromatic.delay lets it settle before capture; a11y off here, scoped onto
// the small ColorSubtree story.
const meta = preview.meta({
  title: 'Tokens/Overview',
  component: TokenNavigator,
  parameters: { chromatic: { delay: 400 }, a11y: { test: 'off' } },
  argTypes: {
    root: { control: 'text' },
    type: { control: 'text' },
    initiallyExpanded: { control: { type: 'number', min: 0, max: 6 } },
  },
});

export default meta;

async function assertRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    const wrapper = canvas.querySelector('[data-swatchbook-block]');
    expect(wrapper, 'navigator must render').toBeTruthy();
  });
}

export const All = meta.story({
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});

export const ColorSubtree = meta.story({
  args: { root: 'color' },
  parameters: { a11y: { test: 'error' } },
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});
