import type { CSSProperties, ReactElement } from 'react';
import { useEffect } from 'react';
import { BORDER_STRONG, SURFACE_DEFAULT, TEXT_DEFAULT } from '#/internal/styles.tsx';
import { TokenDetail } from '#/TokenDetail.tsx';

/**
 * Slide-over that wraps `<TokenDetail>`. Shared between `<TokenNavigator />`
 * and `<TokenTable />` so both land on the same opener and the same styling.
 *
 * Dismisses on backdrop click, Escape, and the close button. `role="dialog"`
 * + `aria-modal="true"` hints to AT that focus is trapped here; actual focus
 * management is tracked in the open-issue #253.
 */

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  } satisfies CSSProperties,
  panel: {
    width: 'min(560px, 100%)',
    height: '100%',
    overflowY: 'auto',
    background: SURFACE_DEFAULT,
    color: TEXT_DEFAULT,
    boxShadow: '-8px 0 24px rgba(0,0,0,0.2)',
    padding: 16,
    position: 'relative',
  } satisfies CSSProperties,
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 4,
    border: BORDER_STRONG,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
  } satisfies CSSProperties,
} as const;

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
    <div style={styles.backdrop} onClick={onClose} role='presentation' data-testid={testId}>
      <div
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-label={`Token detail for ${path}`}
      >
        <button
          type='button'
          style={styles.closeButton}
          onClick={onClose}
          aria-label='Close'
          data-testid={`${testId}-close`}
        >
          ×
        </button>
        <TokenDetail path={path} />
      </div>
    </div>
  );
}
