import { fuzzyFilter } from '@unpunnyfuns/swatchbook-core/fuzzy';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import cx from 'clsx';
import type { ReactElement } from 'react';
import { useCallback, useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './TokenTable.css';
import { ColorFormatContext, useColorFormat } from '#/contexts.ts';
import { CopyButton } from '#/internal/CopyButton.tsx';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { DetailOverlay } from '#/internal/DetailOverlay.tsx';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { useBlockKey, usePersistedState } from '#/internal/persistent-state.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveColorValue, resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import type { ColorFormat } from '#/format-color.ts';
import { useRootFontSize } from '#/internal/use-root-font-size.ts';
import { RowIndicators } from '#/indicators/RowIndicators.tsx';
import { resolveIndicators } from '#/indicators/resolve.ts';
import type { IndicatorsProp } from '#/indicators/resolve.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

export interface TokenTableProps {
  /**
   * Token-path filter. `"color.*"` matches every `color.…` token;
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
   * Render a runtime search input above the table that narrows rows by
   * fuzzy match (case-insensitive, out-of-order terms, single-character
   * typo tolerance) against the token path, type, or value. Defaults to
   * `true` because browsing a multi-hundred-token reference without
   * search is painful. Pass `false` to hide the input (the `filter` /
   * `type` props still apply at authoring time).
   */
  searchable?: boolean;
  /**
   * Called with the clicked row's dot-path. When set, the built-in
   * `<TokenDetail>` slide-over is suppressed — the consumer owns the
   * follow-up UI (inline panel, drill-down route, …).
   */
  onSelect?(path: string): void;
  /** Disambiguates persisted UI state for two identical-prop tables on a page. */
  id?: string;
  /** Configure the per-row indicator strip. See `IndicatorsProp`. */
  indicators?: IndicatorsProp;
  /**
   * Highest-precedence color format for this table's values, overriding
   * an outer `ColorFormatContext` and the project's `defaultColorFormat`.
   * Omit to inherit the existing precedence chain (see `useColorFormat`).
   * Also governs the composed row-detail `TokenDetail` slide-over.
   */
  colorFormat?: ColorFormat;
}

export interface TokenRow {
  path: string;
  type: string;
  value: string;
  outOfGamut: boolean;
  cssVar: string;
  isColor: boolean;
  isDeprecated: boolean;
  token: ProjectData['resolved'][string];
  variance: ProjectData['varianceByPath'][string] | undefined;
}

export interface DeriveTokenRowsOptions {
  filter?: string | undefined;
  type?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
  colorFormat: ColorFormat;
  rootFontSizePx: number;
}

/**
 * Pure derivation of the table's display rows from resolved project data.
 * Carries per-row `isDeprecated` / `token` / `variance` so the View renders
 * the indicator strip and deprecation state without reaching back into the
 * project. Extracted so it is unit-testable without React or a store.
 */
export function deriveTokenRows(
  resolved: ProjectData['resolved'],
  listing: ProjectData['listing'],
  cssVarPrefix: string,
  varianceByPath: ProjectData['varianceByPath'],
  { filter, type, sortBy, sortDir, colorFormat, rootFontSizePx }: DeriveTokenRowsOptions,
): TokenRow[] {
  const projectFields = { listing, cssVarPrefix };
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (!matchPath(path, filter)) return false;
    if (type && token.$type !== type) return false;
    return true;
  });
  const entries = sortTokens(filtered, { by: sortBy, dir: sortDir, rootFontSizePx });
  return entries.map(([path, token]) => {
    const isColor = token.$type === 'color';
    const color = isColor
      ? resolveColorValue(path, token.$value, colorFormat, projectFields)
      : null;
    const dep = token.$deprecated;
    return {
      path,
      type: token.$type ?? '',
      value: formatTokenValue(token.$value, token.$type, colorFormat, listing[path]),
      outOfGamut: color?.outOfGamut ?? false,
      cssVar: resolveCssVar(path, projectFields),
      isColor,
      isDeprecated: dep === true || (typeof dep === 'string' && dep.length > 0),
      token,
      variance: varianceByPath[path],
    };
  });
}

export interface TokenTableViewProps {
  rows: TokenRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  colorFormat: ColorFormat;
  enabledIndicators: ReturnType<typeof resolveIndicators>;
  /** Paths that can be linked to from the indicator strip (membership check). */
  validPaths: ReadonlySet<string>;
  /** Stable persistence key for this table's search + selection state. */
  blockKey: string;
  filter?: string | undefined;
  type?: string | undefined;
  caption?: string | undefined;
  searchable?: boolean;
  onSelect?: ((path: string) => void) | undefined;
}

/**
 * Pure presentation for the token table. Owns its own search + selection UI
 * state; renders from the derived `rows` view-model. Composes the connected
 * DetailOverlay as a child (that child reads the project itself).
 */
export function TokenTableView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  colorFormat,
  enabledIndicators,
  validPaths,
  blockKey,
  filter,
  type,
  caption,
  searchable = true,
  onSelect,
}: TokenTableViewProps): ReactElement {
  const [selectedPath, setSelectedPath] = usePersistedState<string | null>(
    `${blockKey}::selected`,
    null,
  );
  const [query, setQuery] = usePersistedState(`${blockKey}::query`, '');
  const deferredQuery = useDeferredValue(query);

  const visibleRows = useMemo(() => {
    if (!searchable || deferredQuery.trim() === '') return rows;
    return fuzzyFilter(rows, deferredQuery, (row) => `${row.path} ${row.type} ${row.value}`);
  }, [rows, deferredQuery, searchable]);

  const VIRTUALIZE_THRESHOLD = 50;
  const scrollParentRef = useRef<HTMLTableSectionElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const virtualize = typeof window !== 'undefined' && visibleRows.length >= VIRTUALIZE_THRESHOLD;

  useLayoutEffect(() => {
    if (!virtualize) return;
    const el = scrollParentRef.current;
    if (!el) return;
    const update = () => setScrollMargin(el.getBoundingClientRect().top + window.scrollY);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [virtualize]);

  const virtualizer = useWindowVirtualizer({
    count: virtualize ? visibleRows.length : 0,
    estimateSize: () => 40,
    overscan: 8,
    scrollMargin,
  });
  const virtualItems = virtualize ? virtualizer.getVirtualItems() : [];
  const padTop = virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) - scrollMargin : 0;
  const padBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() -
        ((virtualItems[virtualItems.length - 1]?.end ?? 0) - scrollMargin)
      : 0;

  const handleRowClick = useCallback(
    (path: string) => {
      if (onSelect) onSelect(path);
      else setSelectedPath(path);
    },
    [onSelect, setSelectedPath],
  );

  const matchSuffix =
    searchable && query.trim() !== '' ? ` · ${visibleRows.length} matching "${query.trim()}"` : '';
  const captionText =
    caption ??
    `${rows.length} token${rows.length === 1 ? '' : 's'}${
      filter ? ` matching \`${filter}\`` : ''
    }${type ? ` · $type=${type}` : ''}${matchSuffix} · ${activeTheme}`;

  const renderRow = (
    row: TokenRow,
    rowIndex: number,
    measureRef?: (el: HTMLTableRowElement | null) => void,
  ) => {
    const token = row.token;
    return (
      <tr
        key={row.path}
        ref={measureRef}
        data-index={rowIndex}
        aria-rowindex={rowIndex + 2}
        className="sb-token-table__row"
        onClick={() => handleRowClick(row.path)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick(row.path);
          }
        }}
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`Inspect ${row.path}`}
        data-testid="token-table-row"
        data-path={row.path}
      >
        <td
          className={cx('sb-token-table__td', 'sb-token-table__path')}
          data-deprecated={enabledIndicators.deprecation && row.isDeprecated ? 'true' : undefined}
        >
          {row.path}
        </td>
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
            <span
              className="sb-token-table__copy-wrap"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              <CopyButton
                value={row.value}
                label={`Copy value ${row.value}`}
                className="sb-token-table__copy"
              />
            </span>
          </span>
        </td>
        <td className="sb-token-table__td sb-token-table__refs">
          {token && (
            <RowIndicators
              path={row.path}
              token={token}
              root={undefined}
              variance={row.variance}
              colorFormat={colorFormat}
              canReference={(p) => validPaths.has(p)}
              onReferenceClick={(p) => setSelectedPath(p)}
              enabled={enabledIndicators}
            />
          )}
        </td>
      </tr>
    );
  };

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
      {searchable && (
        <div className="sb-token-table__search">
          <input
            type="search"
            className="sb-token-table__search-input"
            placeholder="Search tokens…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Fuzzy-search tokens by path, type, or value"
            data-testid="token-table-search"
          />
        </div>
      )}
      {searchable && (
        <span role="status" aria-live="polite" className="sb-token-table__sr-status">
          {query.trim() !== ''
            ? `${visibleRows.length} of ${rows.length} tokens match "${query.trim()}"`
            : ''}
        </span>
      )}
      <table className="sb-token-table__table" aria-rowcount={visibleRows.length + 1}>
        <caption className="sb-token-table__caption">{captionText}</caption>
        <thead>
          <tr aria-rowindex={1}>
            <th className={cx('sb-token-table__th', 'sb-token-table__th--path')}>Path</th>
            <th className={cx('sb-token-table__th', 'sb-token-table__th--value')}>Value</th>
            <th className="sb-token-table__th sb-token-table__th--refs">
              <span className="sb-token-table__sr-status">References and status</span>
            </th>
          </tr>
        </thead>
        <tbody ref={scrollParentRef}>
          {visibleRows.length === 0 && (
            <tr>
              <td colSpan={3} className="sb-token-table__td sb-token-table__empty-row">
                No tokens match "{query.trim()}".
              </td>
            </tr>
          )}
          {!virtualize && visibleRows.map((row, i) => renderRow(row, i))}
          {virtualize && padTop > 0 && (
            <tr aria-hidden="true" style={{ height: padTop }}>
              <td colSpan={3} />
            </tr>
          )}
          {virtualize &&
            virtualItems.map((vi) => {
              const row = visibleRows[vi.index];
              if (!row) return null;
              return renderRow(row, vi.index, virtualizer.measureElement);
            })}
          {virtualize && padBottom > 0 && (
            <tr aria-hidden="true" style={{ height: padBottom }}>
              <td colSpan={3} />
            </tr>
          )}
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

/**
 * A sortable, searchable table of tokens. Click a row to inspect it in a
 * slide-over (unless `onSelect` is provided, which hands the follow-up to the
 * consumer).
 */
export function TokenTable({
  filter,
  type,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
  searchable = true,
  onSelect,
  id,
  indicators,
  colorFormat,
}: TokenTableProps): ReactElement {
  const project = useProject();
  const {
    resolved,
    activeTheme,
    activeAxes,
    cssVarPrefix,
    listing,
    varianceByPath,
    indicators: indicatorBaseline,
  } = project;
  const contextColorFormat = useColorFormat();
  const format = colorFormat ?? contextColorFormat;
  const rootFontSize = useRootFontSize();
  // Persist selection + search across docs-mode remounts (see persistent-state).
  const blockKey = useBlockKey('TokenTable', [filter, type, caption, id]);
  const enabledIndicators = useMemo(
    () => resolveIndicators(indicators, indicatorBaseline),
    [indicators, indicatorBaseline],
  );
  const rows = useMemo(
    () =>
      deriveTokenRows(resolved, listing, cssVarPrefix, varianceByPath, {
        filter,
        type,
        sortBy,
        sortDir,
        colorFormat: format,
        rootFontSizePx: rootFontSize,
      }),
    [
      resolved,
      listing,
      cssVarPrefix,
      varianceByPath,
      filter,
      type,
      sortBy,
      sortDir,
      format,
      rootFontSize,
    ],
  );
  const validPaths = useMemo(() => new Set(Object.keys(resolved)), [resolved]);

  const view = (
    <TokenTableView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      colorFormat={format}
      enabledIndicators={enabledIndicators}
      validPaths={validPaths}
      blockKey={blockKey}
      filter={filter}
      type={type}
      caption={caption}
      searchable={searchable}
      onSelect={onSelect}
    />
  );

  // The composed row-detail slide-over renders `<TokenDetail>`, which reads
  // ColorFormatContext for itself: provide the override so it inherits it
  // too, but only when a prop override is actually set, to avoid clobbering
  // the ambient default with a value that's just its own echo.
  return colorFormat !== undefined ? (
    <ColorFormatContext.Provider value={colorFormat}>{view}</ColorFormatContext.Provider>
  ) : (
    view
  );
}
