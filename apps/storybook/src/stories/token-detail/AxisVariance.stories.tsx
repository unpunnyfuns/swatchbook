import { AxisVariance } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/AxisVariance',
  component: AxisVariance,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const AccentBg = meta.story({ args: { path: 'color.accent.bg' } });
export const SurfaceDefault = meta.story({ args: { path: 'color.surface.default' } });

export const RendersValuesTableForMultiAxisToken = meta.story({
  args: { path: 'color.accent.bg' },
  play: async ({ canvasElement }) => {
    const table = await waitFor(() => {
      const el = canvasElement.querySelector('[data-testid="token-detail-values"]');
      if (!el) throw new Error('values table not rendered');
      return el;
    });
    // accent.bg is multi-axis varying in the reference fixture; the
    // multi-axis layout uses one-row-per-context. At least two body rows.
    const rows = table.querySelectorAll('.sb-token-detail__theme-row');
    expect(rows.length).toBeGreaterThanOrEqual(2);
  },
});

export const RendersConstantCellForBaselineOnlyToken = meta.story({
  args: { path: 'color.palette.blue.500' },
  play: async ({ canvasElement }) => {
    // Palette primitives don't vary across any axis — block renders the
    // "constant" branch (single cell with `data-testid="token-detail-constant"`).
    const cell = await waitFor(() => {
      const el = canvasElement.querySelector('[data-testid="token-detail-constant"]');
      if (!el) throw new Error('constant cell not rendered');
      return el;
    });
    expect(cell.textContent).toContain('same across every axis');
  },
});
