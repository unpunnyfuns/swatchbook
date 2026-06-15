import { AliasedBy } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/AliasedBy',
  component: AliasedBy,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const RefNeutralZero = meta.story({ args: { path: 'color.palette.neutral.0' } });
export const RefBlue500 = meta.story({ args: { path: 'color.palette.blue.500' } });

export const RendersAliasedByTreeForPrimitive = meta.story({
  args: { path: 'color.palette.neutral.0' },
  play: async ({ canvasElement }) => {
    const header = await waitFor(() => {
      const headers = canvasElement.querySelectorAll('.sb-token-detail__section-header');
      const ab = [...headers].find((h) => h.textContent === 'Aliased by');
      if (!ab) throw new Error('aliased by header not rendered');
      return ab;
    });
    expect(header).toBeTruthy();
    // At least one row in the tree — primitives in the reference fixture
    // are referenced by surface / text role tokens.
    const rows = canvasElement.querySelectorAll('.sb-token-detail__aliased-by-row');
    expect(rows.length).toBeGreaterThan(0);
  },
});

export const RendersNothingForLeafAlias = meta.story({
  args: { path: 'color.surface.default' },
  play: async ({ canvasElement }) => {
    // `color.surface.default` is itself an alias — nothing aliases it.
    // Block returns null.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const header = [...canvasElement.querySelectorAll('.sb-token-detail__section-header')].find(
      (h) => h.textContent === 'Aliased by',
    );
    expect(header).toBeUndefined();
  },
});
