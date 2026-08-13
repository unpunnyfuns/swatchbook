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
 * Three assertions, narrowest first: the decorator's own wrapper generates no
 * box at all, and the chain as a whole adds neither inset nor height. The
 * latter two also cover `SwatchbookProvider`'s host element, which sits between
 * the wrapper and the container.
 *
 * These run in two environments with different containers, so every assertion
 * is computed against `canvasElement`'s *content* box rather than its border
 * box. Under vitest the container is a bare div appended to `body`, with no
 * `#storybook-root` and no `sb-main-*` class, so `layout` is inert and padding
 * is zero. Chromatic runs the same play functions in the real preview iframe,
 * where the container is the story root and carries Storybook's own padding:
 * `centered` puts 1rem on it, which a border-box height check reads as 32px of
 * phantom decorator spacing.
 */
function expectDecoratorAddsNoBox(canvasElement: HTMLElement) {
  const probe = canvasElement.querySelector<HTMLElement>('[data-testid="layout-probe"]');
  if (!probe) throw new Error('layout-probe missing');
  const wrapper = probe.parentElement;
  if (!wrapper) throw new Error('decorator wrapper missing');

  expect(wrapper.getClientRects().length, 'the axis-attribute wrapper must generate no box').toBe(
    0,
  );

  const style = getComputedStyle(canvasElement);
  const box = canvasElement.getBoundingClientRect();
  const contentLeft =
    box.left + Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.borderLeftWidth);
  const contentTop =
    box.top + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.borderTopWidth);
  const contentHeight =
    box.height -
    Number.parseFloat(style.paddingTop) -
    Number.parseFloat(style.paddingBottom) -
    Number.parseFloat(style.borderTopWidth) -
    Number.parseFloat(style.borderBottomWidth);

  const probeBox = probe.getBoundingClientRect();
  expect(probeBox.left, 'decorator must not inset the story horizontally').toBeCloseTo(
    contentLeft,
    1,
  );
  expect(probeBox.top, 'decorator must not inset the story vertically').toBeCloseTo(contentTop, 1);
  expect(contentHeight, 'decorator must not add height around the story').toBeCloseTo(
    probeBox.height,
    1,
  );
}

/** `padded` puts 1rem on `body`; the decorator must not add a second inset inside the root. */
export const Padded = meta.story({
  parameters: { layout: 'padded' },
  play: ({ canvasElement }) => expectDecoratorAddsNoBox(canvasElement),
});

/** `centered` puts 1rem on the story root and centres it with `margin: auto`. */
export const Centered = meta.story({
  parameters: { layout: 'centered' },
  play: ({ canvasElement }) => expectDecoratorAddsNoBox(canvasElement),
});

/** `fullscreen` zeroes both, so any box the decorator adds is the only spacing present. */
export const Fullscreen = meta.story({
  parameters: { layout: 'fullscreen' },
  play: ({ canvasElement }) => expectDecoratorAddsNoBox(canvasElement),
});

/** No layout class at all: the baseline the other three are measured against. */
export const NoLayout = meta.story({
  parameters: { layout: 'none' },
  play: ({ canvasElement }) => expectDecoratorAddsNoBox(canvasElement),
});
