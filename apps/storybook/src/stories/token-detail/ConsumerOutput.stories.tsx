import { ConsumerOutput } from '@unpunnyfuns/swatchbook-blocks';
import { expect, userEvent, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

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

export const CopyPathWritesToClipboard = meta.story({
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
        const el = canvasElement.querySelector<HTMLElement>(
          '[data-testid="consumer-output-path-copy"]',
        );
        if (!el) throw new Error('copy button not rendered');
        return el;
      });
      await userEvent.click(btn);
      await waitFor(() => {
        if (writes.length === 0) throw new Error('clipboard not written');
      });
      expect(writes).toEqual(['color.accent.bg']);
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    }
  },
});

export const CopyCssWritesToClipboard = meta.story({
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
        const el = canvasElement.querySelector<HTMLElement>(
          '[data-testid="consumer-output-css-copy"]',
        );
        if (!el) throw new Error('copy button not rendered');
        return el;
      });
      await userEvent.click(btn);
      await waitFor(() => {
        if (writes.length === 0) throw new Error('clipboard not written');
      });
      expect(writes).toEqual(['var(--sb-color-accent-bg)']);
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    }
  },
});
