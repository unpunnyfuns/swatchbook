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
import { page, userEvent } from 'vitest/browser';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { renderOverlay } from './_detail-overlay-helpers.tsx';

afterEach(cleanup);

it('calls onClose on Escape', async () => {
  const { onClose } = renderOverlay();
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('calls onClose on backdrop click', async () => {
  // The panel is a right-aligned slide-over (`min(560px, 100%)`), so a bare
  // backdrop strip only exists at desktop widths — at narrow widths the panel
  // fills the viewport and there is nothing outside it to click. Widen the
  // viewport, then aim a real geometry click at the top-left (bare backdrop),
  // the way a user dismisses the overlay by clicking outside the panel.
  await page.viewport(1024, 768);
  const { onClose } = renderOverlay();
  const backdrop = screen.getByTestId('swatchbook-overlay');
  await userEvent.click(backdrop, { position: { x: 8, y: 8 } });
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
