import { DimensionScale } from '@unpunnyfuns/swatchbook-blocks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

const meta = preview.meta({
  title: 'Blocks/DimensionScale',
  component: DimensionScale,
  argTypes: {
    filter: { control: 'text' },
    kind: { control: 'select', options: ['length', 'radius', 'size'] },
  },
});

export default meta;

async function assertScaleRenders(canvas: HTMLElement): Promise<void> {
  await waitFor(() => {
    const bars = canvas.querySelectorAll('[aria-hidden="true"]');
    expect(bars.length, 'scale must render at least one visual').toBeGreaterThan(0);
  });
}

export const SpaceSystem = meta.story({
  args: { filter: 'space.sys.*' },
  play: async ({ canvasElement }) => assertScaleRenders(canvasElement),
});
export const RadiusSystem = meta.story({ args: { filter: 'radius.sys.*', kind: 'radius' } });
export const SizeReferencePx = meta.story({
  args: { filter: 'size.ref.*', kind: 'size' },
  play: async ({ canvasElement }) => assertScaleRenders(canvasElement),
});
export const All = meta.story();
