import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import {
  BORDER_DEFAULT,
  MONO_STACK,
  TEXT_DEFAULT,
  TEXT_MUTED,
  captionStyle,
  emptyStyle,
  surfaceStyle,
} from '#/internal/styles.tsx';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';

export interface StrokeStyleSampleProps {
  /**
   * Token-path filter. Defaults to every `strokeStyle` token. Use e.g.
   * `"stroke.ref.style.*"` to scope to the ref layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order. `'path'` (default) sorts lexicographically on the
   * dot-path; `'value'` ordering falls through to path for this block's
   * type (composite / non-numeric); `'none'` preserves project order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

const STRING_STYLES = new Set([
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'outset',
  'inset',
]);

const styles = {
  wrapper: surfaceStyle,
  caption: captionStyle,
  empty: emptyStyle,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 1fr auto',
    gap: 16,
    alignItems: 'center',
    padding: '14px 0',
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
  value: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: TEXT_MUTED,
  } satisfies CSSProperties,
  line: {
    height: 0,
    borderTopWidth: 4,
    borderTopColor: TEXT_DEFAULT,
    width: '100%',
  } satisfies CSSProperties,
  objectFallback: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: TEXT_MUTED,
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: TEXT_MUTED,
  } satisfies CSSProperties,
};

interface Row {
  path: string;
  cssVar: string;
  displayValue: string;
  cssStyle: string | null;
}

function extractCssStyle(value: unknown): string | null {
  if (typeof value === 'string' && STRING_STYLES.has(value)) return value;
  return null;
}

export function StrokeStyleSample({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: StrokeStyleSampleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'strokeStyle') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
      path,
      cssVar: makeCssVar(path, cssVarPrefix),
      displayValue: formatTokenValue(token.$value, token.$type, 'raw'),
      cssStyle: extractCssStyle(token.$value),
    }));
  }, [resolved, filter, cssVarPrefix, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} strokeStyle token${rows.length === 1 ? '' : 's'}${filter && filter !== 'strokeStyle' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div
        {...themeAttrs(cssVarPrefix, activeTheme)}
        style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
      >
        <div style={styles.empty}>No strokeStyle tokens match this filter.</div>
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
            <span style={styles.value}>{row.displayValue}</span>
          </div>
          {row.cssStyle ? (
            <div
              style={{
                ...styles.line,
                borderTopStyle: row.cssStyle as CSSProperties['borderTopStyle'],
              }}
              aria-hidden
            />
          ) : (
            <span style={styles.objectFallback}>
              Object-form (dashArray + lineCap) — no pure CSS `border-style` equivalent.
            </span>
          )}
          <span style={styles.cssVar}>{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
