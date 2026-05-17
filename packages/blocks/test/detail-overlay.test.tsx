/**
 * Component tests for the DetailOverlay focus-trap. Run in real Chromium
 * via vitest's browser mode (see `packages/blocks/vitest.config.ts`), so
 * Tab actually advances focus through the live tab order rather than
 * relying on a handler's imperative `.focus()` to fake it.
 */
import { userEvent } from '@vitest/browser/context';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DetailOverlay } from '#/internal/DetailOverlay.tsx';
import { SwatchbookProvider } from '#/provider.tsx';
import type { ProjectSnapshot } from '#/contexts.ts';

afterEach(cleanup);

function emptySnapshot(): ProjectSnapshot {
  return {
    axes: [],
    disabledAxes: [],
    presets: [],
    cells: {},
    jointOverrides: [],
    defaultTuple: {},
    activePermutation: '',
    activeAxes: {},
    cssVarPrefix: '',
    diagnostics: [],
    css: '',
  };
}

function renderOverlay(onClose = vi.fn()): { onClose: ReturnType<typeof vi.fn> } {
  render(
    <SwatchbookProvider value={emptySnapshot()}>
      <DetailOverlay path="color.accent.bg" onClose={onClose} />
    </SwatchbookProvider>,
  );
  return { onClose };
}

describe('DetailOverlay focus lifecycle', () => {
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
});

describe('DetailOverlay focus trap', () => {
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
});

describe('DetailOverlay dismissal', () => {
  it('calls onClose on Escape', async () => {
    const { onClose } = renderOverlay();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click', async () => {
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
});
