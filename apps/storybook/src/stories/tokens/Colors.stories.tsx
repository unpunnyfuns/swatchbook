import { ColorTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

// Catalog story for $type: color. Mounts <ColorTable> (the existing block);
// this is the consumer-facing pattern, distinct from Blocks/ColorTable which
// exercises the component's variants/tests.
const meta = preview.meta({
  title: 'Tokens/Colors',
  component: ColorTable,
  // a11y scoped per the cost rule (#1212/#1213): full-dataset axe trips the
  // addon-vitest manager-UI timeout. Re-enabled on the small RefBlue story.
  parameters: { a11y: { test: 'off' } },
  argTypes: {
    filter: { control: 'text' },
    sortBy: { control: 'select', options: ['path', 'value', 'none'] },
    sortDir: { control: 'select', options: ['asc', 'desc'] },
    searchable: { control: 'boolean' },
  },
});

export default meta;

async function assertRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    const wrapper = canvas.querySelector('[data-swatchbook-block]');
    expect(wrapper, 'block must render').toBeTruthy();
  });
}

export const Palette = meta.story({
  args: { filter: 'color.**' },
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});

// Small, single-ramp story carrying the a11y check for this type.
export const RefBlue = meta.story({
  args: { filter: 'color.palette.blue.**' },
  parameters: { a11y: { test: 'error' } },
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});

// Demonstrates the theme-pin escape hatch: this story pins a tuple over the
// toolbar via parameters.swatchbook.axes. The decorator writes data-sb-<axis>
// on <html> and reverts on unmount.
export const DarkBrandA = meta.story({
  args: { filter: 'color.**' },
  parameters: { swatchbook: { axes: { mode: 'Dark', brand: 'Brand A', contrast: 'Normal' } } },
  play: async ({ canvasElement }) => {
    await assertRenders(canvasElement);
    await waitFor(() => {
      expect(
        document.documentElement.getAttribute('data-sb-mode'),
        'pinned tuple applies mode=Dark to <html>',
      ).toBe('Dark');
    });
  },
});
