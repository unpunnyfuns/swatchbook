/**
 * DetailOverlay focus-lifecycle assertions — mount moves focus into
 * the dialog; unmount restores it to the previously-active element.
 * Real-browser via vitest-browser so `document.activeElement` reflects
 * what an actual user / a11y tree sees.
 *
 * Trap + dismissal coverage lives in
 * `detail-overlay-focus-trap.browser.test.tsx` and
 * `detail-overlay-dismissal.browser.test.tsx`.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DetailOverlay } from '#/internal/DetailOverlay.tsx';
import { SwatchbookProvider } from '#/provider.tsx';
import { emptySnapshot, renderOverlay } from './_detail-overlay-helpers.tsx';

afterEach(cleanup);

it('moves focus into the panel on mount', () => {
  renderOverlay();
  const panel = screen.getByRole('dialog');
  expect(document.activeElement).toBe(panel);
});

it('restores focus to the previously-active element on unmount', () => {
  const opener = document.createElement('button');
  opener.textContent = 'opener';
  document.body.appendChild(opener);
  opener.focus();
  expect(document.activeElement).toBe(opener);

  const { unmount } = render(
    <SwatchbookProvider value={emptySnapshot()}>
      <DetailOverlay path="color.accent.bg" onClose={() => {}} />
    </SwatchbookProvider>,
  );
  expect(document.activeElement).not.toBe(opener);

  unmount();
  expect(document.activeElement).toBe(opener);
  document.body.removeChild(opener);
});
