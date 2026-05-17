/**
 * DetailOverlay focus-trap assertions — Tab and Shift+Tab cycle within
 * the dialog, never escaping to the page body. Real-browser via
 * vitest-browser so `userEvent.tab()` advances the live tab order
 * rather than a jsdom approximation.
 *
 * Lifecycle + dismissal coverage lives in
 * `detail-overlay-focus-lifecycle.browser.test.tsx` and
 * `detail-overlay-dismissal.browser.test.tsx`.
 */
import { userEvent } from '@vitest/browser/context';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { renderOverlay } from './_detail-overlay-helpers.tsx';

afterEach(cleanup);

it('Tab from the panel advances focus to the only inner focusable (the close button)', async () => {
  renderOverlay();
  const panel = screen.getByRole('dialog');
  const closeBtn = screen.getByRole('button', { name: 'Close' });
  expect(document.activeElement).toBe(panel);
  await userEvent.tab();
  expect(document.activeElement).toBe(closeBtn);
});

it('Tab from the last focusable wraps to the first', async () => {
  renderOverlay();
  const closeBtn = screen.getByRole('button', { name: 'Close' });
  closeBtn.focus();
  await userEvent.tab();
  // Empty-state panel has only one focusable; wrapping returns focus
  // to the close button. Real-browser Tab order is exercised here —
  // if the trap fails, focus escapes to the body / document.
  expect(document.activeElement).toBe(closeBtn);
});

it('Shift+Tab from the first focusable wraps to the last', async () => {
  renderOverlay();
  const closeBtn = screen.getByRole('button', { name: 'Close' });
  closeBtn.focus();
  await userEvent.tab({ shift: true });
  expect(document.activeElement).toBe(closeBtn);
});

it('keeps focus inside the panel across many consecutive Tab presses', async () => {
  // Each Tab depends on the previous one's effect, so this is
  // sequential by necessity; recursion sidesteps the await-in-loop
  // lint without changing behaviour.
  renderOverlay();
  const panel = screen.getByRole('dialog');
  const tabAndAssert = async (count: number, attempt: number): Promise<void> => {
    if (attempt > count) return;
    await userEvent.tab();
    expect(
      panel.contains(document.activeElement),
      `Tab press ${attempt} escaped the dialog (active: ${document.activeElement?.tagName})`,
    ).toBe(true);
    await tabAndAssert(count, attempt + 1);
  };
  await tabAndAssert(8, 1);
});
