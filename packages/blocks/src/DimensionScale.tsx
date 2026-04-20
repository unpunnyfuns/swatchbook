import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { DimensionBar, type DimensionKind } from '#/dimension-scale/DimensionBar.tsx';
import { BORDER_DEFAULT, MONO_STACK } from '#/internal/styles.tsx';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export type { DimensionKind };

export interface DimensionScaleProps {
  /**
   * Token-path filter. Defaults to every `dimension` token. Use e.g.
   * `"space.sys.*"` to scope to the spacing scale.
   */
  filter?: string;
  /**
   * Visualization kind:
   * - `'length'` (default): horizontal bar whose width equals the token's dimension.
   * - `'radius'`: 56×56 square with the token applied as `border-radius`.
   * - `'size'`: a square sized to the token's dimension.
   */
  kind?: DimensionKind;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order.
   * - `'value'` (default) — numeric by rendered pixel size (`px` / `rem` / `em`).
   *   Non-convertible units (ex/ch/%) land after the convertible ones.
   * - `'path'` — lexicographic on the dot-path.
   * - `'none'` — preserve project iteration order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

const MAX_RENDER_PX = 480;

const styles = {
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 1fr auto',
    gap: 16,
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: BORDER_DEFAULT,
  } satisfies CSSProperties,
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  } satisfies CSSProperties,
  path: {
    fontFamily: MONO_STACK,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  specs: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    opacity: 0.7,
  } satisfies CSSProperties,
  visualCell: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    opacity: 0.7,
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  cap: {
    fontFamily: MONO_STACK,
    fontSize: 10,
    opacity: 0.6,
    marginLeft: 6,
  } satisfies CSSProperties,
};

interface Row {
  path: string;
  cssVar: string;
  displayValue: string;
  pxValue: number;
  capped: boolean;
}

/**
 * Convert a DTCG dimension `$value` (`{ value, unit }`) to pixels for the
 * purpose of ordering and deciding whether to show a cap indicator.
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

export function DimensionScale({
  filter,
  kind = 'length',
  caption,
  sortBy = 'value',
  sortDir = 'asc',
}: DimensionScaleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'dimension') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => {
      const pxValue = toPixels(token.$value);
      return {
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        displayValue: formatTokenValue(token.$value, token.$type, 'raw'),
        pxValue,
        capped: Number.isFinite(pxValue) && pxValue > MAX_RENDER_PX,
      };
    });
  }, [resolved, filter, cssVarPrefix, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} dimension${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)} style={chromeAliases(cssVarPrefix)}>
        <div className='sb-block__empty'>No dimension tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)} style={chromeAliases(cssVarPrefix)}>
      <div className='sb-block__caption'>{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} style={styles.row}>
          <div style={styles.meta}>
            <span style={styles.path}>{row.path}</span>
            <span style={styles.specs}>{row.displayValue}</span>
          </div>
          <div style={styles.visualCell}>
            <DimensionBar path={row.path} kind={kind} />
            {row.capped && <span style={styles.cap}>capped at {MAX_RENDER_PX}px</span>}
          </div>
          <span style={styles.cssVar}>{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
