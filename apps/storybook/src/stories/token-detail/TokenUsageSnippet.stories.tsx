import { TokenUsageSnippet } from '@unpunnyfuns/swatchbook-blocks';
import { expect, userEvent, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/TokenUsageSnippet',
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

export const CopySnippetWritesToClipboard = meta.story({
  args: { path: 'color.accent.bg' },
  play: async ({ canvasElement }) => {
    const writes: string[] = [];
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          writes.push(text);
          return Promise.resolve();
        },
      },
    });
    try {
      const btn = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('.sb-token-detail__snippet-row button');
        if (!el) throw new Error('copy button not rendered');
        return el;
      });
      await userEvent.click(btn);
      await waitFor(() => {
        if (writes.length === 0) throw new Error('clipboard not written');
      });
      expect(writes).toEqual(['color: var(--sb-color-accent-bg);']);
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    }
  },
});
