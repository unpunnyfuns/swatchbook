/**
 * jsdom is honest for event handlers, useEffect lifecycle, and direct
 * DOM manipulation — and that's what this file tests. The Tab-key
 * trap is verified in a real browser by the `OverlayFocusTrap` play
 * test in `apps/storybook/src/stories/TokenTable.stories.tsx`, because
 * jsdom doesn't implement the browser's tabbing model and any "Shift+Tab
 * wraps focus" assertion here would be testing the handler against my
 * own model of the browser, not the browser itself.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    permutations: [],
    permutationsResolved: {},
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
    // Programmatic .focus() in a useEffect — jsdom implements this
    // correctly, so the test exercises real React lifecycle behaviour.
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

describe('DetailOverlay dismissal', () => {
  it('calls onClose on Escape', () => {
    const { onClose } = renderOverlay();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click', () => {
    const { onClose } = renderOverlay();
    const backdrop = screen.getByTestId('swatchbook-overlay');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on close-button click', () => {
    const { onClose } = renderOverlay();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the panel', () => {
    const { onClose } = renderOverlay();
    const panel = screen.getByRole('dialog');
    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });
});
