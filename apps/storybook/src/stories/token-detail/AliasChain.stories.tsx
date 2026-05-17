import { AliasChain } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Internals/TokenDetail/AliasChain',
  component: AliasChain,
  argTypes: {
    path: { control: 'text' },
  },
});

export default meta;

export const AccentBg = meta.story({ args: { path: 'color.accent.bg' } });
export const SpaceMd = meta.story({ args: { path: 'space.md' } });

export const RendersChainHeaderAndAtLeastOneHop = meta.story({
  args: { path: 'color.accent.bg' },
  play: async ({ canvasElement }) => {
    const header = await waitFor(() => {
      const headers = canvasElement.querySelectorAll('.sb-token-detail__section-header');
      const aliasHeader = [...headers].find((h) => h.textContent === 'Alias chain');
      if (!aliasHeader) throw new Error('alias chain header not rendered');
      return aliasHeader;
    });
    expect(header).toBeTruthy();
    const nodes = canvasElement.querySelectorAll('.sb-token-detail__chain-node');
    // Chain renders [source, ...hops]; an aliased token has ≥ 2 nodes.
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    expect(nodes[0]?.textContent).toBe('color.accent.bg');
  },
});

export const RendersNothingForPrimitive = meta.story({
  args: { path: 'color.palette.blue.500' },
  play: async ({ canvasElement }) => {
    // Primitive tokens have no aliasChain / aliasOf — the block returns
    // null. Wait one frame to let React commit, then assert absence.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const header = [...canvasElement.querySelectorAll('.sb-token-detail__section-header')].find(
      (h) => h.textContent === 'Alias chain',
    );
    expect(header).toBeUndefined();
  },
});
