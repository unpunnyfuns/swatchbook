import { TokenDetail } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/TokenDetail',
  component: TokenDetail,
  argTypes: {
    path: { control: 'text' },
    heading: { control: 'text' },
  },
});

export default meta;

async function assertDetailRenders(canvas: HTMLElement, path: string): Promise<void> {
  await waitFor(() => {
    const heading = canvas.querySelector('h3, h2');
    expect(heading?.textContent, 'token heading should contain the dot-path').toContain(path);
  });
}

export const SysSurface = meta.story({
  args: { path: 'color.surface.default' },
  play: async ({ canvasElement, args }) => assertDetailRenders(canvasElement, args.path as string),
});
export const SysAccent = meta.story({ args: { path: 'color.text.accent' } });
export const AccentBg = meta.story({
  args: { path: 'color.accent.bg' },
  play: async ({ canvasElement, args }) => assertDetailRenders(canvasElement, args.path as string),
});
export const SpaceMd = meta.story({ args: { path: 'space.md' } });
export const TypographyBody = meta.story({
  args: { path: 'typography.body' },
  play: async ({ canvasElement, args }) => assertDetailRenders(canvasElement, args.path as string),
});
export const Gradient = meta.story({ args: { path: 'gradient.sunrise' } });
export const StrokeStyleString = meta.story({ args: { path: 'stroke.style.dashed' } });
export const StrokeStyleObject = meta.story({ args: { path: 'stroke.style.custom-dash' } });
export const Missing = meta.story({ args: { path: 'color.does.not.exist' } });
