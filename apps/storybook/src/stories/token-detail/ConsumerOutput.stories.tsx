import { ConsumerOutput } from '@unpunnyfuns/swatchbook-blocks';
import { expect, userEvent, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenDetail/ConsumerOutput',
  component: ConsumerOutput,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

async function tabButton(root: HTMLElement, key: string): Promise<HTMLElement> {
  await waitFor(() => {
    const btn = root.querySelector<HTMLElement>(`[data-testid="consumer-output-tab-${key}"]`);
    if (!btn) throw new Error(`tab ${key} not rendered`);
  });
  const btn = root.querySelector<HTMLElement>(`[data-testid="consumer-output-tab-${key}"]`);
  if (!btn) throw new Error(`tab ${key} missing`);
  return btn;
}

async function contentText(root: HTMLElement): Promise<string> {
  const el = root.querySelector<HTMLElement>('[data-testid="consumer-output-content"]');
  return el?.textContent ?? '';
}

export const Color = meta.story({
  args: { path: 'color.sys.accent.bg' },
  parameters: { swatchbook: { axes: { mode: 'Light', brand: 'Default' } } },
});

export const Space = meta.story({
  args: { path: 'space.sys.md' },
});

export const CssTabByDefault = meta.story({
  args: { path: 'color.sys.accent.bg' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const el = canvasElement.querySelector('[data-testid="consumer-output-content"]');
      if (!el) throw new Error('content not rendered');
    });
    const text = await contentText(canvasElement);
    expect(text).toContain('var(--sb-color-sys-accent-bg)');
    expect(text).toContain('--sb-color-sys-accent-bg:');
  },
});

export const SwitchToJson = meta.story({
  args: { path: 'color.sys.accent.bg' },
  play: async ({ canvasElement }) => {
    const btn = await tabButton(canvasElement, 'json');
    await userEvent.click(btn);
    await waitFor(async () => {
      const text = await contentText(canvasElement);
      if (!text.includes('"$type"')) throw new Error(`missing $type: ${text}`);
    });
    const text = await contentText(canvasElement);
    expect(text).toContain('"$type"');
    expect(text).toContain('"$value"');
    expect(text).toContain('"color"');
  },
});

export const SwitchToJs = meta.story({
  args: { path: 'color.sys.accent.bg' },
  play: async ({ canvasElement }) => {
    const btn = await tabButton(canvasElement, 'js');
    await userEvent.click(btn);
    await waitFor(async () => {
      const text = await contentText(canvasElement);
      if (!text.includes('useToken')) throw new Error(`missing useToken: ${text}`);
    });
    const text = await contentText(canvasElement);
    expect(text).toContain("from '@unpunnyfuns/swatchbook-addon/hooks'");
    expect(text).toContain('useToken("color.sys.accent.bg")');
  },
});

export const SwitchToTs = meta.story({
  args: { path: 'color.sys.accent.bg' },
  play: async ({ canvasElement }) => {
    const btn = await tabButton(canvasElement, 'ts');
    await userEvent.click(btn);
    await waitFor(async () => {
      const text = await contentText(canvasElement);
      if (!text.includes('color.sys.accent.bg')) throw new Error(`missing path: ${text}`);
    });
    const text = await contentText(canvasElement);
    expect(text).toContain('"color.sys.accent.bg"');
    expect(text).toContain('string');
  },
});
