import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import './DetailOverlay.css';
import { TokenDetail } from '#/TokenDetail.tsx';

/**
 * Slide-over that wraps `<TokenDetail>`. Shared between `<TokenNavigator />`
 * and `<TokenTable />` so both land on the same opener and the same styling.
 *
 * Dismisses on backdrop click, Escape, and the close button. Implements the
 * WAI-ARIA dialog pattern's focus management: on mount, focus moves into the
 * panel; Tab is trapped so it cycles through the panel's interactive
 * descendants only; on unmount, focus restores to whatever opened the
 * overlay (typically the row / treeitem the user clicked).
 */

export interface DetailOverlayProps {
  path: string;
  onClose(): void;
  testId?: string;
}

/**
 * Selector for elements the trap considers focus stops. Mirrors the
 * "tabbable" set most focus-trap libraries use; the `:not(...)` clauses
 * skip the panel wrapper itself (we focus it manually on mount via its
 * own ref) and any explicitly-detabbed descendants.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function DetailOverlay({
  path,
  onClose,
  testId = 'swatchbook-overlay',
}: DetailOverlayProps): ReactElement {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Save the opener + focus the panel on mount; restore the opener's
  // focus on unmount. Document-level activeElement is the only reliable
  // signal of what triggered the overlay since the click might have come
  // from a row, a tree item, a programmatic open, etc.
  useEffect(() => {
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => {
      openerRef.current?.focus();
    };
  }, []);

  // Window-level Escape handler: works whether or not focus is currently
  // inside the panel (e.g. user clicked the backdrop, focus moved away).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /**
   * Wrap Tab inside the panel: from the last focusable, jump to the first;
   * from the first (or from the panel itself), Shift+Tab jumps to the last.
   * Defers to the browser otherwise.
   */
  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (!first || !last) return;
    if (e.shiftKey) {
      if (active === first || active === panel) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="sb-detail-overlay__backdrop"
      onClick={onClose}
      role="presentation"
      data-testid={testId}
    >
      <div
        ref={panelRef}
        className="sb-detail-overlay__panel"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onPanelKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={`Token detail for ${path}`}
        tabIndex={-1}
      >
        <button
          type="button"
          className="sb-detail-overlay__close"
          onClick={onClose}
          aria-label="Close"
          data-testid={`${testId}-close`}
        >
          ×
        </button>
        <TokenDetail path={path} />
      </div>
    </div>
  );
}
