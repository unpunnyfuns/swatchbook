import { ColorPalette, ColorTable } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

// Catalog stories for $type: color. The swatch-grid views use <ColorPalette>
// (Palette = the primitive ramps, Semantic = the role tier), mirroring the
// Colors docs page; <ColorTable> carries the detailed/searchable form. This is
// the consumer-facing pattern, distinct from Blocks/ColorPalette and
// Blocks/ColorTable, which exercise each component's variants and tests.
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

// Swatch grid of the primitive ramps (`color.palette.*`).
export const Palette = meta.story({
  render: () => <ColorPalette filter="color.palette.**" />,
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});

// Swatch grid grouped by role — the semantic tier (`color.surface.*`,
// `color.text.*`, `color.accent.*`, …) alongside the ramps.
export const Semantic = meta.story({
  render: () => <ColorPalette filter="color.**" />,
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});

// Detailed, sortable, searchable table over every color token.
export const Table = meta.story({
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
