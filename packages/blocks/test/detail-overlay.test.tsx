import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DetailOverlay } from '#/internal/DetailOverlay.tsx';
import { SwatchbookProvider } from '#/provider.tsx';
import type { ProjectSnapshot } from '#/contexts.ts';

afterEach(cleanup);

// Minimal snapshot — DetailOverlay renders a `<TokenDetail>` inside, which
// needs a provider but doesn't have to find the path: an unknown path
// renders the empty-state branch and that's fine for testing the trap
// itself.
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

describe('DetailOverlay focus management', () => {
  it('moves focus into the panel on mount', () => {
    renderOverlay();
    const panel = screen.getByRole('dialog');
    expect(document.activeElement).toBe(panel);
  });

  it('restores focus to the previously-active element when unmounted', () => {
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

  it('Shift+Tab from the panel wraps to the last focusable', () => {
    renderOverlay();
    const panel = screen.getByRole('dialog');
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    // Panel currently focused (post-mount). Shift+Tab should jump to the
    // last focusable inside the panel.
    fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true });
    // Empty-state TokenDetail contributes no focusables; the only one is
    // the close button, so it's both first and last.
    expect(document.activeElement).toBe(closeBtn);
  });

  it('Tab from the last focusable wraps to the first', () => {
    renderOverlay();
    const panel = screen.getByRole('dialog');
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    closeBtn.focus();
    fireEvent.keyDown(panel, { key: 'Tab' });
    // Close button is both first and last in the empty-state panel; the
    // wrap returns focus to it.
    expect(document.activeElement).toBe(closeBtn);
  });

  it('does not intercept Tab when focus is mid-list (delegates to browser)', () => {
    renderOverlay();
    const panel = screen.getByRole('dialog');
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    panel.dispatchEvent(event);
    // With only one focusable, the only case where the trap intervenes is
    // when active === last. Otherwise it lets the browser handle Tab.
    // Here `active === panel` so the trap doesn't intervene.
    expect(event.defaultPrevented).toBe(false);
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
