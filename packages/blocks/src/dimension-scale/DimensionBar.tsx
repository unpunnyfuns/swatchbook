import type { CSSProperties, ReactElement } from 'react';
import { BORDER_STRONG } from '#/internal/styles.tsx';
import { chromeAliases } from '#/internal/data-attr.ts';
import { makeCssVar, useProject } from '#/internal/use-project.ts';

export type DimensionKind = 'length' | 'radius' | 'size';

export interface DimensionBarProps {
  /** Full dot-path of the dimension token to preview. */
  path: string;
  /**
   * Visualization kind:
   * - `'length'` (default): horizontal bar whose width equals the token's dimension.
   * - `'radius'`: 56×56 square with the token applied as `border-radius`.
   * - `'size'`: a square sized to the token's dimension.
   */
  kind?: DimensionKind;
}

const MAX_RENDER_PX = 480;

const styles = {
  bar: {
    height: 14,
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
    borderRadius: 2,
    minWidth: 1,
  } satisfies CSSProperties,
  radiusSample: {
    width: 56,
    height: 56,
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
    border: BORDER_STRONG,
  } satisfies CSSProperties,
  sizeSample: {
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
    border: BORDER_STRONG,
    minWidth: 1,
    minHeight: 1,
  } satisfies CSSProperties,
};

/**
 * Convert a DTCG dimension `$value` (`{ value, unit }`) to pixels for the
 * purpose of deciding whether to cap the rendered bar. Returns `NaN` for
 * units we can't reasonably approximate (ex / ch / %), which the caller
 * treats as "render at cssVar but don't cap".
 */
function toPixels(raw: unknown): number {
  if (raw == null || typeof raw !== 'object') return Number.NaN;
  const v = raw as { value?: unknown; unit?: unknown };
  if (typeof v.value !== 'number' || typeof v.unit !== 'string') return Number.NaN;
  switch (v.unit) {
    case 'px':
      return v.value;
    case 'rem':
    case 'em':
      return v.value * 16;
    default:
      return Number.NaN;
  }
}

export function DimensionBar({ path, kind = 'length' }: DimensionBarProps): ReactElement {
  const { resolved, cssVarPrefix } = useProject();
  const cssVar = makeCssVar(path, cssVarPrefix);
  const token = resolved[path];
  const pxValue = toPixels(token?.$value);
  const capped = Number.isFinite(pxValue) && pxValue > MAX_RENDER_PX;
  const cappedValue = capped ? `${MAX_RENDER_PX}px` : cssVar;

  const aliases = chromeAliases(cssVarPrefix);
  switch (kind) {
    case 'radius':
      return (
        <div style={{ ...aliases, ...styles.radiusSample, borderRadius: cssVar }} aria-hidden />
      );
    case 'size':
      return (
        <div
          style={{ ...aliases, ...styles.sizeSample, width: cappedValue, height: cappedValue }}
          aria-hidden
        />
      );
    case 'length':
    default:
      return <div style={{ ...aliases, ...styles.bar, width: cappedValue }} aria-hidden />;
  }
}
