import { TokenHeader } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/TokenHeader',
  component: TokenHeader,
  argTypes: {
    path: { control: 'text' },
    heading: { control: 'text' },
  },
});

export default meta;

export const Default = meta.story({ args: { path: 'color.accent.bg' } });
export const WithHeading = meta.story({
  args: { path: 'typography.heading', heading: 'Heading typography' },
});

export const RendersPathTypePillAndCssVar = meta.story({
  args: { path: 'color.accent.bg' },
  play: async ({ canvasElement }) => {
    const heading = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLHeadingElement>('.sb-token-detail__heading');
      if (!el) throw new Error('heading not rendered');
      return el;
    });
    expect(heading.textContent).toBe('color.accent.bg');
    const pill = canvasElement.querySelector('.sb-token-detail__type-pill');
    expect(pill?.textContent).toBe('color');
    expect(canvasElement.textContent).toContain('var(--sb-color-accent-bg)');
  },
});

export const HeadingPropOverridesPath = meta.story({
  args: { path: 'typography.heading', heading: 'Custom Heading' },
  play: async ({ canvasElement }) => {
    const heading = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLHeadingElement>('.sb-token-detail__heading');
      if (!el) throw new Error('heading not rendered');
      return el;
    });
    expect(heading.textContent).toBe('Custom Heading');
  },
});

export const RendersMissingFallbackForUnknownPath = meta.story({
  args: { path: 'color.does.not.exist' },
  play: async ({ canvasElement }) => {
    const missing = await waitFor(() => {
      const el = canvasElement.querySelector('.sb-token-detail__missing');
      if (!el) throw new Error('missing fallback not rendered');
      return el;
    });
    expect(missing.textContent).toContain('color.does.not.exist');
  },
});
