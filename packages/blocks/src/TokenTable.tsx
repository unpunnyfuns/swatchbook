import cx from 'clsx';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import './TokenTable.css';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
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
      <div {...themeAttrs(cssVarPrefix, activeTheme)}>
        <div className="sb-block__empty">No tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)}>
      <table className="sb-token-table__table">
        <caption className="sb-token-table__caption">{captionText}</caption>
        <thead>
          <tr>
            <th className={cx('sb-token-table__th', 'sb-token-table__th--path')}>Path</th>
            <th className={cx('sb-token-table__th', 'sb-token-table__th--value')}>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.path}
              className="sb-token-table__row"
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
              <td className={cx('sb-token-table__td', 'sb-token-table__path')}>{row.path}</td>
              <td className="sb-token-table__td">
                <span className="sb-token-table__value-cell">
                  {row.type && <span className="sb-token-table__type-pill">{row.type}</span>}
                  {row.isColor && (
                    <span
                      className="sb-token-table__swatch"
                      style={{ background: row.cssVar }}
                      aria-hidden
                    />
                  )}
                  <span
                    className="sb-token-table__value-text"
                    title={row.value}
                    data-testid="token-table-value"
                  >
                    {row.value}
                  </span>
                  {row.outOfGamut && (
                    <span
                      title="Out of sRGB gamut for this format"
                      aria-label="out of gamut"
                      className="sb-token-table__gamut-warn"
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
