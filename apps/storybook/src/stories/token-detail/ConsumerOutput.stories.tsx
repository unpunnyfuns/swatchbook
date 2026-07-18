import { ConsumerOutput } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/ConsumerOutput',
  component: ConsumerOutput,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Color = meta.story({
  args: { path: 'color.accent.bg' },
  parameters: { swatchbook: { axes: { mode: 'Light', brand: 'Default' } } },
});

export const Space = meta.story({
  args: { path: 'space.md' },
});

export const RendersPathAndCssRows = meta.story({
  args: { path: 'color.accent.bg' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const pathEl = canvasElement.querySelector('[data-testid="consumer-output-path"]');
      const cssEl = canvasElement.querySelector('[data-testid="consumer-output-css"]');
      if (!pathEl || !cssEl) throw new Error('rows not rendered');
    });
    const pathEl = canvasElement.querySelector('[data-testid="consumer-output-path"]');
    const cssEl = canvasElement.querySelector('[data-testid="consumer-output-css"]');
    expect(pathEl?.textContent).toBe('color.accent.bg');
    expect(cssEl?.textContent).toBe('var(--sb-color-accent-bg)');
  },
});
