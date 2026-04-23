import { fuzzyFilter } from '@unpunnyfuns/swatchbook-core/fuzzy';
import cx from 'clsx';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import './ColorTable.css';
import { formatColor, type NormalizedColor } from '#/format-color.ts';
import { CopyButton } from '#/internal/CopyButton.tsx';
import { themeAttrs } from '#/internal/data-attr.ts';
import { DetailOverlay } from '#/internal/DetailOverlay.tsx';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface ColorTableProps {
  /**
   * Token-path filter. Defaults to every `$type: color` token. `"color.*"`
   * scopes to the semantic layer; `"color.palette.blue.*"` to a single ramp.
   */
  filter?: string;
  /** Override the table caption. */
  caption?: string;
  /**
   * Sort order.
   * - `'path'` (default) — lexicographic on the dot-path.
   * - `'value'` — perceptual (oklch L → C → H). Ramps read light→dark, then
   *   warm→cool within each lightness band.
   * - `'none'` — preserve project iteration order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
  /**
   * Render a fuzzy-search input above the table (case-insensitive,
   * single-char typo tolerance, out-of-order terms, matches across path +
   * any format value). Defaults to `true`.
   */
  searchable?: boolean;
  /**
   * Called with the clicked row's dot-path. When set, the built-in
   * `<TokenDetail>` drawer is suppressed — the consumer owns follow-up UI.
   */
  onSelect?(path: string): void;
  /**
   * Map from a display label to a path-suffix matched against the final
   * hyphen segment of each leaf. A row whose leaf ends in `-<suffix>` gets
   * the matching label rendered as a pill after the token name.
   *
   * Longest-suffix-wins: given `{ hover: 'h', hoverDark: 'h-dark' }`, a path
   * ending in `-h-dark` picks `hoverDark`, not `hover`. Tokens that don't
   * match any suffix render with no pill — configuration is purely additive.
   *
   * Empty map (default) → no pills; the block behaves exactly as before.
   */
  variants?: Record<string, string>;
}

interface Row {
  path: string;
  cssVar: string;
  hex: string;
  hsl: string;
  oklch: string;
  hexOutOfGamut: boolean;
  aliasOf?: string;
  variant?: string;
}

export function ColorTable({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
  searchable = true,
  onSelect,
  variants,
}: ColorTableProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const variantIndex = useMemo(() => buildVariantIndex(variants), [variants]);

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'color') return false;
      return globMatch(path, filter);
    });
    const entries = sortTokens(filtered, { by: sortBy, dir: sortDir });
    return entries.map(([path, token]) => {
      const raw = token.$value as NormalizedColor;
      const hex = formatColor(raw, 'hex');
      const hsl = formatColor(raw, 'hsl');
      const oklch = formatColor(raw, 'oklch');
      const variant = matchVariant(path, variantIndex);
      return {
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        hex: hex.value,
        hsl: hsl.value,
        oklch: oklch.value,
        hexOutOfGamut: hex.outOfGamut,
        ...(token.aliasOf !== undefined && { aliasOf: token.aliasOf }),
        ...(variant !== undefined && { variant }),
      };
    });
  }, [resolved, filter, cssVarPrefix, sortBy, sortDir, variantIndex]);

  const visibleRows = useMemo(() => {
    if (!searchable || query.trim() === '') return rows;
    return fuzzyFilter(rows, query, (r) => `${r.path} ${r.hex} ${r.hsl} ${r.oklch}`);
  }, [rows, query, searchable]);

  const handleRowClick = useCallback(
    (path: string) => {
      if (onSelect) onSelect(path);
      else setSelectedPath(path);
    },
    [onSelect],
  );

  const matchSuffix =
    searchable && query.trim() !== '' ? ` · ${visibleRows.length} matching "${query.trim()}"` : '';
  const captionText =
    caption ??
    `${rows.length} color${rows.length === 1 ? '' : 's'}${
      filter ? ` matching \`${filter}\`` : ''
    }${matchSuffix} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)}>
        <div className="sb-block__empty">No color tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)}>
      {searchable && (
        <div className="sb-color-table__search">
          <input
            type="search"
            className="sb-color-table__search-input"
            placeholder="Search colors…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Fuzzy-search colors by path or value"
            data-testid="color-table-search"
          />
        </div>
      )}
      <table className="sb-color-table__table">
        <caption className="sb-color-table__caption">{captionText}</caption>
        <thead>
          <tr>
            <th className="sb-color-table__th sb-color-table__th--swatch">
              <span className="sb-color-table__sr-only">Swatch</span>
            </th>
            <th className="sb-color-table__th sb-color-table__th--path">Name</th>
            <th className="sb-color-table__th">HEX</th>
            <th className="sb-color-table__th">HSL</th>
            <th className="sb-color-table__th">OKLCH</th>
            <th className="sb-color-table__th">CSS var</th>
            <th className="sb-color-table__th">Alias</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 && (
            <tr>
              <td colSpan={7} className="sb-color-table__td sb-color-table__empty-row">
                No colors match "{query.trim()}".
              </td>
            </tr>
          )}
          {visibleRows.map((row) => (
            <tr
              key={row.path}
              className="sb-color-table__row"
              onClick={() => handleRowClick(row.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRowClick(row.path);
                }
              }}
              tabIndex={0}
              aria-label={`Inspect ${row.path}`}
              data-testid="color-table-row"
              data-path={row.path}
            >
              <td className="sb-color-table__td sb-color-table__swatch-cell">
                <span
                  className="sb-color-table__swatch"
                  style={{ background: row.cssVar }}
                  aria-hidden
                />
              </td>
              <td className={cx('sb-color-table__td', 'sb-color-table__path')}>
                <span className="sb-color-table__path-text">{row.path}</span>
                {row.variant !== undefined && (
                  <span
                    className="sb-color-table__variant-pill"
                    data-variant={row.variant}
                    data-testid="color-table-variant"
                  >
                    {row.variant}
                  </span>
                )}
              </td>
              <ValueCell value={row.hex} label={`Copy HEX ${row.hex}`}>
                {row.hexOutOfGamut && (
                  <span
                    title="Out of sRGB gamut"
                    aria-label="out of gamut"
                    className="sb-color-table__gamut-warn"
                  >
                    ⚠
                  </span>
                )}
              </ValueCell>
              <ValueCell value={row.hsl} label={`Copy HSL ${row.hsl}`} />
              <ValueCell value={row.oklch} label={`Copy OKLCH ${row.oklch}`} />
              <ValueCell value={row.cssVar} label={`Copy CSS var ${row.cssVar}`} />
              <td className="sb-color-table__td sb-color-table__alias">
                {row.aliasOf ? (
                  <span className="sb-color-table__alias-text">{row.aliasOf}</span>
                ) : (
                  <span className="sb-color-table__alias-empty" aria-hidden>
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPath !== null && (
        <DetailOverlay
          path={selectedPath}
          onClose={() => setSelectedPath(null)}
          testId="color-table-overlay"
        />
      )}
    </div>
  );
}

function ValueCell({
  value,
  label,
  children,
}: {
  value: string;
  label: string;
  children?: ReactElement | false;
}): ReactElement {
  return (
    <td className="sb-color-table__td sb-color-table__value-cell">
      <span className="sb-color-table__value-text" title={value}>
        {value}
      </span>
      {children}
      <span
        className="sb-color-table__copy-wrap"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <CopyButton value={value} label={label} className="sb-color-table__copy" />
      </span>
    </td>
  );
}

interface VariantEntry {
  label: string;
  suffix: string;
}

/**
 * Pre-sort the variants map by descending suffix length so the first
 * `endsWith` hit during matching is always the longest. Empty suffixes are
 * dropped — they'd match every path and make the feature meaningless.
 */
function buildVariantIndex(variants: Record<string, string> | undefined): readonly VariantEntry[] {
  if (!variants) return [];
  const entries: VariantEntry[] = [];
  for (const [label, suffix] of Object.entries(variants)) {
    if (suffix.length === 0) continue;
    entries.push({ label, suffix });
  }
  entries.sort((a, b) => b.suffix.length - a.suffix.length);
  return entries;
}

/**
 * Resolve the variant label for a token path, if any. The leaf (last
 * dot-segment) must end in `-<suffix>` — the leading hyphen is required, so
 * suffix `h` matches `hi-h` but not `neutral-900` (by character), and does
 * not match `highlight` (where `h` isn't preceded by a boundary). Entries
 * are tried longest-first, so `h-dark` wins over `dark` when both are
 * configured and the path ends in `-h-dark`.
 */
function matchVariant(path: string, variantIndex: readonly VariantEntry[]): string | undefined {
  if (variantIndex.length === 0) return undefined;
  const leaf = path.split('.').at(-1) ?? path;
  for (const entry of variantIndex) {
    if (leaf.endsWith(`-${entry.suffix}`)) return entry.label;
  }
  return undefined;
}
