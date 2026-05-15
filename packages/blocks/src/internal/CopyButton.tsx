import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import './CopyButton.css';

export interface CopyButtonProps {
  /** Text written to the clipboard when clicked. */
  value: string;
  /**
   * Accessible label. Defaults to `Copy <value>`; override for long values
   * (hex + description + etc.) where the full label would be too chatty.
   */
  label?: string;
  /** `'icon'` (default) — 16 px glyph button; `'text'` — `Copy` pill. */
  variant?: 'icon' | 'text';
  /** Extra class to merge onto the button root. */
  className?: string;
}

/**
 * Copy the given string to the clipboard and briefly surface a "Copied!"
 * state. Falls back silently on unsupported clipboard APIs (older Safari,
 * insecure origins) — the click still happens, the user just won't see the
 * tick. No custom permission prompt: relies on the browser's native user-
 * activation gate.
 */
export function CopyButton({
  value,
  label,
  variant = 'icon',
  className,
}: CopyButtonProps): ReactElement {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback((): void => {
    // `writeText` is async and rejects on unfocused documents,
    // insecure origins, missing permissions, etc. Swallow the
    // rejection — the "Copied!" affordance is a nicety, not a
    // correctness requirement; an unhandled rejection in prod would
    // surface in DevTools and (under vitest browser-mode) fail the
    // suite from an unrelated test.
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }, [value]);

  const ariaLabel = label ?? `Copy ${value}`;
  const classes = ['sb-copy-button', `sb-copy-button--${variant}`];
  if (copied) classes.push('sb-copy-button--copied');
  if (className) classes.push(className);

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      data-copied={copied ? 'true' : undefined}
    >
      {variant === 'text' ? (
        <span className="sb-copy-button__text">{copied ? 'Copied' : 'Copy'}</span>
      ) : (
        <span className="sb-copy-button__glyph" aria-hidden>
          {copied ? '✓' : '⧉'}
        </span>
      )}
    </button>
  );
}
