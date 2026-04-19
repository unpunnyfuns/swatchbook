import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { DimensionBar, type DimensionKind } from '#/dimension-scale/DimensionBar.tsx';
import {
  BORDER_DEFAULT,
  captionStyle,
  emptyStyle,
  MONO_STACK,
  surfaceStyle,
} from '#/internal/styles.tsx';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
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
}

const MAX_RENDER_PX = 480;

const styles = {
  wrapper: surfaceStyle,
  caption: captionStyle,
  empty: emptyStyle,
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
  filter = 'dimension',
  kind = 'length',
  caption,
}: DimensionScaleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo(() => {
    const collected: Row[] = [];
    for (const [path, token] of Object.entries(resolved)) {
      if (token.$type !== 'dimension') continue;
      if (!globMatch(path, filter)) continue;
      const pxValue = toPixels(token.$value);
      collected.push({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        displayValue: formatTokenValue(token.$value, token.$type, 'raw'),
        pxValue,
        capped: Number.isFinite(pxValue) && pxValue > MAX_RENDER_PX,
      });
    }
    collected.sort((a, b) => {
      if (Number.isFinite(a.pxValue) && Number.isFinite(b.pxValue)) return a.pxValue - b.pxValue;
      return a.path.localeCompare(b.path, undefined, { numeric: true });
    });
    return collected;
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} dimension${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div
        {...themeAttrs(cssVarPrefix, activeTheme)}
        style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
      >
        <div style={styles.empty}>No dimension tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div
      {...themeAttrs(cssVarPrefix, activeTheme)}
      style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
    >
      <div style={styles.caption}>{captionText}</div>
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
