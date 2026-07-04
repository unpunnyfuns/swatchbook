import { TypographyScale } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

// Composite layer ($type: typography). Each token renders as a sample line
// using all its composed sub-values (fontFamily/fontSize/fontWeight/
// lineHeight/letterSpacing). Composite rows carry the composes indicator in
// the table/tree views.
const meta = preview.meta({
  title: 'Tokens/Typography',
  component: TypographyScale,
  parameters: { a11y: { test: 'off' } },
  argTypes: {
    filter: { control: 'text' },
    sample: { control: 'text' },
  },
});

export default meta;

async function assertRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    const wrapper = canvas.querySelector('[data-swatchbook-block]');
    expect(wrapper?.textContent, 'typography scale must include a typography path').toMatch(
      /typography\./,
    );
  });
}

export const Scale = meta.story({
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});

export const HeadingOnly = meta.story({
  args: { filter: 'typography.heading' },
  parameters: { a11y: { test: 'error' } },
  play: async ({ canvasElement }) => assertRenders(canvasElement),
});
