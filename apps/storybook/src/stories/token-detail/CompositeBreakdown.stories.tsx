import { CompositeBreakdown } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/CompositeBreakdown',
  component: CompositeBreakdown,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const Typography = meta.story({ args: { path: 'typography.heading' } });
export const Shadow = meta.story({ args: { path: 'shadow.md' } });
export const Border = meta.story({ args: { path: 'border.default' } });
export const Transition = meta.story({ args: { path: 'transition.enter' } });
export const Gradient = meta.story({ args: { path: 'gradient.sunrise' } });

export const TypographyRendersKeyValueGrid = meta.story({
  args: { path: 'typography.heading' },
  play: async ({ canvasElement }) => {
    const section = await waitFor(() => {
      const el = canvasElement.querySelector('.sb-token-detail__breakdown-section');
      if (!el) throw new Error('breakdown section not rendered');
      return el;
    });
    // Typography breakdown renders one row per composite field; expect
    // at least font-family and font-size keys.
    const keys = section.querySelectorAll('.sb-token-detail__breakdown-key');
    const keyTexts = [...keys].map((k) => k.textContent);
    expect(keyTexts).toContain('fontFamily');
    expect(keyTexts).toContain('fontSize');
  },
});

export const ShadowRendersOffsetAndBlurKeys = meta.story({
  args: { path: 'shadow.md' },
  play: async ({ canvasElement }) => {
    // Single-layer shadow renders one key/value grid (no "Layer N" header
    // — that only appears for multi-layer values like shadow.lg).
    const section = await waitFor(() => {
      const el = canvasElement.querySelector('.sb-token-detail__breakdown-section');
      if (!el) throw new Error('breakdown section not rendered');
      return el;
    });
    const keyTexts = [...section.querySelectorAll('.sb-token-detail__breakdown-key')].map(
      (k) => k.textContent,
    );
    expect(keyTexts).toContain('color');
    expect(keyTexts).toContain('offsetY');
    expect(keyTexts).toContain('blur');
  },
});
