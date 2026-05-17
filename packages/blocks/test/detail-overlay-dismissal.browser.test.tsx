/**
 * DetailOverlay dismissal assertions — Escape, backdrop click, close
 * button, and the non-dismissing inner-panel click. Real-browser via
 * vitest-browser so click hit-testing reflects actual stacking +
 * bounding-box geometry rather than jsdom's pretend dispatch.
 *
 * Lifecycle + focus-trap coverage lives in
 * `detail-overlay-focus-lifecycle.browser.test.tsx` and
 * `detail-overlay-focus-trap.browser.test.tsx`.
 */
import { userEvent } from '@vitest/browser/context';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { renderOverlay } from './_detail-overlay-helpers.tsx';

afterEach(cleanup);

it('calls onClose on Escape', async () => {
  const { onClose } = renderOverlay();
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('calls onClose on backdrop click', () => {
  // The backdrop sits behind the panel (right-aligned, 560px wide).
  // `userEvent.click(backdrop)` aims at the element's bounding-box
  // center, which the panel covers — Playwright then clicks the
  // panel and `stopPropagation` swallows it. Click the top-left
  // corner instead to hit the visible backdrop area, matching how a
  // real user dismisses the overlay (anywhere outside the panel).
  const { onClose } = renderOverlay();
  const backdrop = screen.getByTestId('swatchbook-overlay');
  backdrop.click();
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('calls onClose on close-button click', async () => {
  const { onClose } = renderOverlay();
  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('does not close when clicking inside the panel', async () => {
  const { onClose } = renderOverlay();
  const panel = screen.getByRole('dialog');
  await userEvent.click(panel);
  expect(onClose).not.toHaveBeenCalled();
});
