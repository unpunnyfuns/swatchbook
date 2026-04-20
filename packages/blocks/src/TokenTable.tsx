import type { CSSProperties, ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import {
  BORDER_FAINT,
  BORDER_STRONG,
  MONO_STACK,
  SIZE_LABEL,
  SIZE_META,
  SIZE_PILL,
  SURFACE_MUTED,
  TEXT_MUTED,
} from '#/internal/styles.tsx';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { DetailOverlay } from '#/internal/DetailOverlay.tsx';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface TokenTableProps {
  /**
   * Token-path filter. `"color.sys.*"` matches every `color.sys.…` token;
   * omit to include everything. Combines with `type` (both must match).
   */
  filter?: string;
  /** Restrict to one DTCG `$type`. */
  type?: string;
  /** Override the table caption. */
  caption?: string;
  /**
   * Sort order.
   * - `'path'` (default) — lexicographic on the dot-path.
   * - `'value'` — per-`$type`: numeric for `dimension` / `duration` /
   *   `fontWeight`; perceptual (oklch L → C → H) for `color`; lexicographic
   *   for `fontFamily` / `strokeStyle`. Composite types fall through to
   *   path order.
   * - `'none'` — preserve project iteration order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
  /**
   * Called with the clicked row's dot-path. When set, the built-in
   * `<TokenDetail>` slide-over is suppressed — the consumer owns the
   * follow-up UI (inline panel, drill-down route, …).
   */
  onSelect?(path: string): void;
}

const styles = {
  caption: {
    captionSide: 'top',
    textAlign: 'left',
    padding: '8px 0',
    color: TEXT_MUTED,
    fontSize: SIZE_META,
  } satisfies CSSProperties,
  table: {
    // `tableLayout: auto` lets column widths follow content; the per-cell
    // `minWidth` values below keep the important columns from collapsing
    // on narrow containers.
    width: '100%',
    borderCollapse: 'collapse',
  } satisfies CSSProperties,
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: SIZE_LABEL,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: TEXT_MUTED,
    borderBottom: BORDER_STRONG,
  } satisfies CSSProperties,
  thPath: {
    minWidth: 180,
  } satisfies CSSProperties,
  thValue: {
    minWidth: 160,
  } satisfies CSSProperties,
  row: {
    cursor: 'pointer',
  } satisfies CSSProperties,
  td: {
    padding: '8px 12px',
    borderBottom: BORDER_FAINT,
    verticalAlign: 'top',
  } satisfies CSSProperties,
  path: {
    fontFamily: MONO_STACK,
    fontSize: SIZE_META,
  } satisfies CSSProperties,
  valueCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    fontFamily: MONO_STACK,
    fontSize: SIZE_META,
  } satisfies CSSProperties,
  typePill: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: SIZE_PILL,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    background: SURFACE_MUTED,
    color: TEXT_MUTED,
    fontFamily: MONO_STACK,
    flexShrink: 0,
  } satisfies CSSProperties,
  swatch: {
    display: 'inline-block',
    width: 16,
    height: 16,
    borderRadius: 3,
    border: BORDER_STRONG,
    flexShrink: 0,
  } satisfies CSSProperties,
  valueText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
};

export function TokenTable({
  filter,
  type,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
  onSelect,
}: TokenTableProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();
  const colorFormat = useColorFormat();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const rows = useMemo(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (!globMatch(path, filter)) return false;
      if (type && token.$type !== type) return false;
      return true;
    });
    const entries = sortTokens(filtered, { by: sortBy, dir: sortDir });
    return entries.map(([path, token]) => {
      const isColor = token.$type === 'color';
      const color = isColor ? formatColor(token.$value, colorFormat) : null;
      return {
        path,
        type: token.$type ?? '',
        value: formatTokenValue(token.$value, token.$type, colorFormat),
        outOfGamut: color?.outOfGamut ?? false,
        cssVar: makeCssVar(path, cssVarPrefix),
        isColor,
      };
    });
  }, [resolved, filter, type, cssVarPrefix, colorFormat, sortBy, sortDir]);

  const handleRowClick = useCallback(
    (path: string) => {
      if (onSelect) onSelect(path);
      else setSelectedPath(path);
    },
    [onSelect],
  );

  const captionText =
    caption ??
    `${rows.length} token${rows.length === 1 ? '' : 's'}${
      filter ? ` matching \`${filter}\`` : ''
    }${type ? ` · $type=${type}` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)} style={chromeAliases(cssVarPrefix)}>
        <div className='sb-block__empty'>No tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)} style={chromeAliases(cssVarPrefix)}>
      <table style={styles.table}>
        <caption style={styles.caption}>{captionText}</caption>
        <thead>
          <tr>
            <th style={{ ...styles.th, ...styles.thPath }}>Path</th>
            <th style={{ ...styles.th, ...styles.thValue }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.path}
              style={styles.row}
              onClick={() => handleRowClick(row.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRowClick(row.path);
                }
              }}
              tabIndex={0}
              aria-label={`Inspect ${row.path}`}
              data-testid="token-table-row"
              data-path={row.path}
            >
              <td style={{ ...styles.td, ...styles.path }}>{row.path}</td>
              <td style={styles.td}>
                <span style={styles.valueCell}>
                  {row.type && <span style={styles.typePill}>{row.type}</span>}
                  {row.isColor && (
                    <span style={{ ...styles.swatch, background: row.cssVar }} aria-hidden />
                  )}
                  <span style={styles.valueText} title={row.value} data-testid="token-table-value">
                    {row.value}
                  </span>
                  {row.outOfGamut && (
                    <span
                      title="Out of sRGB gamut for this format"
                      aria-label="out of gamut"
                      style={{ flexShrink: 0 }}
                    >
                      ⚠
                    </span>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPath !== null && (
        <DetailOverlay
          path={selectedPath}
          onClose={() => setSelectedPath(null)}
          testId="token-table-overlay"
        />
      )}
    </div>
  );
}
