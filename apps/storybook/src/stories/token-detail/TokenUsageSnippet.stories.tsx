import { TokenUsageSnippet } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '#storybook/preview.tsx';

const meta = preview.meta({
  title: 'Inspector/TokenDetail/TokenUsageSnippet',
  component: TokenUsageSnippet,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Color = meta.story({ args: { path: 'color.accent.bg' } });
export const Space = meta.story({ args: { path: 'space.md' } });

export const RendersSnippetAndCssVar = meta.story({
  args: { path: 'color.accent.bg' },
  play: async ({ canvasElement }) => {
    const snippet = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>('.sb-token-detail__snippet');
      if (!el) throw new Error('snippet not rendered');
      return el;
    });
    expect(snippet.textContent).toBe('color: var(--sb-color-accent-bg);');
  },
});
