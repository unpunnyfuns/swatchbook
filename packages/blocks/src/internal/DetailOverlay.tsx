import type { ReactElement } from 'react';
import { useEffect } from 'react';
import './DetailOverlay.css';
import { TokenDetail } from '#/TokenDetail.tsx';

/**
 * Slide-over that wraps `<TokenDetail>`. Shared between `<TokenNavigator />`
 * and `<TokenTable />` so both land on the same opener and the same styling.
 *
 * Dismisses on backdrop click, Escape, and the close button. `role="dialog"`
 * + `aria-modal="true"` hints to AT that focus is trapped here, but full
 * focus-trap implementation is still outstanding.
 */

export interface DetailOverlayProps {
  path: string;
  onClose(): void;
  testId?: string;
}

export function DetailOverlay({
  path,
  onClose,
  testId = 'swatchbook-overlay',
}: DetailOverlayProps): ReactElement {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="sb-detail-overlay__backdrop"
      onClick={onClose}
      role="presentation"
      data-testid={testId}
    >
      <div
        className="sb-detail-overlay__panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Token detail for ${path}`}
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
