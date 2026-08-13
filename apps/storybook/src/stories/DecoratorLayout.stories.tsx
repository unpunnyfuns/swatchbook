import { expect } from 'storybook/test';
import preview from '#storybook/preview.tsx';

/**
 * Fixed-height, auto-width block. Any box the addon's decorator chain
 * contributes shows up as an inset between this and the story container.
 */
function LayoutProbe() {
  return <div data-testid="layout-probe" style={{ height: 24, background: '#0066cc' }} />;
}

const meta = preview.meta({
  title: 'Tests/DecoratorLayout',
  tags: ['!manifest', '!dev'],
  component: LayoutProbe,
});

export default meta;

/**
 * Storybook owns story spacing through the `layout` parameter, applied to
 * `body` (`.sb-main-padded`) or the story root (`.sb-main-centered
 * #storybook-root`). The addon's decorator renders inside that root, so any box
 * it contributes stacks on top rather than replacing it.
 *
 * The assertion is that the probe sits flush against its container and the
 * container is no taller than the probe: true for every `layout` value, because
 * it measures only what the decorator adds, not what Storybook does.
 *
 * Note the play function can't verify `layout` itself. The vitest harness
 * renders into a bare div appended to `body` — no `#storybook-root`, no
 * `sb-main-*` class — so the parameter is inert here. The four stories still
 * differ in the real preview iframe, which is where Chromatic snapshots them.
 */
function expectDecoratorAddsNoBox(canvasElement: HTMLElement) {
  const probe = canvasElement.querySelector<HTMLElement>('[data-testid="layout-probe"]');
  if (!probe) throw new Error('layout-probe missing');

  const style = getComputedStyle(canvasElement);
  const box = canvasElement.getBoundingClientRect();
  const contentLeft =
    box.left + Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.borderLeftWidth);
  const contentTop =
    box.top + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.borderTopWidth);

  const probeBox = probe.getBoundingClientRect();
  expect(probeBox.left, 'decorator must not inset the story horizontally').toBeCloseTo(
    contentLeft,
    1,
  );
  expect(probeBox.top, 'decorator must not inset the story vertically').toBeCloseTo(contentTop, 1);
  expect(box.height, 'decorator must not add height around the story').toBeCloseTo(
    probeBox.height,
    1,
  );
}

export const Padded = meta.story({
  parameters: { layout: 'padded' },
  play: ({ canvasElement }) => expectDecoratorAddsNoBox(canvasElement),
});

export const Centered = meta.story({
  parameters: { layout: 'centered' },
  play: ({ canvasElement }) => expectDecoratorAddsNoBox(canvasElement),
});

export const Fullscreen = meta.story({
  parameters: { layout: 'fullscreen' },
  play: ({ canvasElement }) => expectDecoratorAddsNoBox(canvasElement),
});

export const NoLayout = meta.story({
  parameters: { layout: 'none' },
  play: ({ canvasElement }) => expectDecoratorAddsNoBox(canvasElement),
});
