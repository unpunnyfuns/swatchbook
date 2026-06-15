import { CompositePreview } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/CompositePreview',
  component: CompositePreview,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Color = meta.story({ args: { path: 'color.accent.bg' } });
export const Shadow = meta.story({ args: { path: 'shadow.md' } });
export const Border = meta.story({ args: { path: 'border.default' } });
export const Transition = meta.story({ args: { path: 'transition.enter' } });
export const Typography = meta.story({ args: { path: 'typography.body' } });
export const Gradient = meta.story({ args: { path: 'gradient.sunrise' } });
export const StrokeStyle = meta.story({ args: { path: 'stroke.style.custom-dash' } });

export const ColorRendersSwatchRow = meta.story({
  args: { path: 'color.accent.bg' },
  play: async ({ canvasElement }) => {
    const row = await waitFor(() => {
      const el = canvasElement.querySelector('.sb-token-detail__color-swatch-row');
      if (!el) throw new Error('color swatch row not rendered');
      return el;
    });
    // Light + dark swatches both rendered for the same color cssVar.
    expect(row.querySelector('.sb-token-detail__color-swatch-light')).toBeTruthy();
    expect(row.querySelector('.sb-token-detail__color-swatch-dark')).toBeTruthy();
  },
});

export const TypographyRendersPangramSample = meta.story({
  args: { path: 'typography.body' },
  play: async ({ canvasElement }) => {
    const sample = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>('.sb-token-detail__typography-sample');
      if (!el) throw new Error('typography sample not rendered');
      return el;
    });
    // Sample has the pangram text; its font-family resolves through the
    // composite's sub-vars (renders even if the cssVar resolution is empty).
    expect(sample.textContent?.length ?? 0).toBeGreaterThan(0);
  },
});

export const ShadowRendersSample = meta.story({
  args: { path: 'shadow.md' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const el = canvasElement.querySelector('.sb-token-detail__shadow-sample');
      if (!el) throw new Error('shadow sample not rendered');
    });
  },
});
