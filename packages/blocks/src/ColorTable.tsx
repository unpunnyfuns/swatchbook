import { fuzzyFilter } from '@unpunnyfuns/swatchbook-core/fuzzy';
import cx from 'clsx';
import type { ReactElement } from 'react';
import { Fragment, useCallback, useMemo, useState } from 'react';
import './ColorTable.css';
import { useColorFormat } from '#/contexts.ts';
import { type ColorFormat, formatColor, type NormalizedColor } from '#/format-color.ts';
import { CopyButton } from '#/internal/CopyButton.tsx';
import { themeAttrs } from '#/internal/data-attr.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

const BASE_LABEL = 'base';
const COLUMN_COUNT = 6;

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
   * Render a fuzzy-search input above the table. Defaults to `true`.
   */
  searchable?: boolean;
  /**
   * Called with the *currently-selected* variant's dot-path on row click.
   * When set, the built-in expand-in-place behavior is suppressed — the
   * consumer owns follow-up UI.
   */
  onSelect?(path: string): void;
  /**
   * Map from a display label to a suffix matched against each token's
   * trailing path segment. Tokens whose leaves match a suffix are grouped
   * under a shared "base" path (the path with the suffix stripped), and
   * the group renders as a single row with a pill selector — clicking a
   * pill swaps the displayed values to that variant. Sibling tokens
   * without a suffix that share the group's base path are labeled `base`.
   *
   * Matches both DTCG-idiomatic and Backmarket-style conventions:
   * - **Dot segment** (`color.bg.hi.disabled`): last dot-segment equals
   *   the suffix (`disabled`). Base path = drop the last segment.
   * - **Hyphen tail** (`color.bg.hi-d`): last dot-segment ends in
   *   `-<suffix>` (`d`). Base path = trim the `-<suffix>` from the leaf.
   *
   * Longest-suffix-wins. Hyphen-tail form requires an actual hyphen
   * boundary — suffix `0` does not match `neutral-900`.
   *
   * Single-member groups render as plain rows (no pill selector). Empty
   * map (default) disables grouping entirely; each token renders as its
   * own row, identical to the pre-grouping behavior.
   */
  variants?: Record<string, string>;
}

interface Variant {
  label: string;
  path: string;
  cssVar: string;
  /** The display value in the currently-active color format. */
  value: string;
  outOfGamut: boolean;
  /** Hex / HSL / OKLCH breakdown — retained for the expanded sub-table. */
  hex: string;
  hsl: string;
  oklch: string;
  description?: string;
  aliasOf?: string;
  aliasChain?: readonly string[];
}

interface Group {
  base: string;
  variants: Variant[];
  searchText: string;
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
  const colorFormat = useColorFormat();
  const [query, setQuery] = useState('');
  const [selectedByBase, setSelectedByBase] = useState<Record<string, string>>({});
  const [expandedByBase, setExpandedByBase] = useState<ReadonlySet<string>>(() => new Set());

  const defs = useMemo(() => buildVariantDefs(variants), [variants]);

  const groups = useMemo<Group[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'color') return false;
      return globMatch(path, filter);
    });
    const sorted = sortTokens(filtered, { by: sortBy, dir: sortDir });

    const groupMap = new Map<string, { base: string; variants: Variant[] }>();
    for (const [path, token] of sorted) {
      const raw = token.$value as NormalizedColor;
      const hex = formatColor(raw, 'hex');
      const hsl = formatColor(raw, 'hsl');
      const oklch = formatColor(raw, 'oklch');
      const active = pickActiveFormat(raw, colorFormat, hex, hsl, oklch);
      const match = matchVariant(path, defs.matchOrder);
      const variant: Variant = {
        label: match?.label ?? BASE_LABEL,
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        value: active.value,
        outOfGamut: active.outOfGamut,
        hex: hex.value,
        hsl: hsl.value,
        oklch: oklch.value,
        ...(token.$description !== undefined && { description: token.$description }),
        ...(token.aliasOf !== undefined && { aliasOf: token.aliasOf }),
        ...(token.aliasChain !== undefined && { aliasChain: token.aliasChain }),
      };
      const basePath = match?.basePath ?? path;
      const existing = groupMap.get(basePath);
      if (existing) existing.variants.push(variant);
      else groupMap.set(basePath, { base: basePath, variants: [variant] });
    }

    const out: Group[] = [];
    for (const { base, variants: vs } of groupMap.values()) {
      vs.sort((a, b) => orderIndex(a.label, defs) - orderIndex(b.label, defs));
      const searchText = vs.map((v) => `${v.path} ${v.value}`).join(' ');
      out.push({ base, variants: vs, searchText });
    }
    return out;
  }, [resolved, filter, cssVarPrefix, sortBy, sortDir, defs, colorFormat]);

  const visibleGroups = useMemo(() => {
    if (!searchable || query.trim() === '') return groups;
    return fuzzyFilter(groups, query, (g) => g.searchText);
  }, [groups, query, searchable]);

  const totalTokens = useMemo(() => groups.reduce((n, g) => n + g.variants.length, 0), [groups]);

  const toggleExpand = useCallback((base: string) => {
    setExpandedByBase((prev) => {
      const next = new Set(prev);
      if (next.has(base)) next.delete(base);
      else next.add(base);
      return next;
    });
  }, []);

  const selectVariant = useCallback((base: string, label: string) => {
    setSelectedByBase((prev) => ({ ...prev, [base]: label }));
  }, []);

  const matchSuffix =
    searchable && query.trim() !== ''
      ? ` · ${visibleGroups.length} matching "${query.trim()}"`
      : '';
  const captionText =
    caption ??
    `${totalTokens} color${totalTokens === 1 ? '' : 's'} across ${groups.length} group${
      groups.length === 1 ? '' : 's'
    }${filter ? ` matching \`${filter}\`` : ''}${matchSuffix} · ${activeTheme}`;

  if (groups.length === 0) {
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
            <th className="sb-color-table__th">Value</th>
            <th className="sb-color-table__th">CSS var</th>
            <th className="sb-color-table__th">Alias</th>
            <th className="sb-color-table__th sb-color-table__th--expand">
              <span className="sb-color-table__sr-only">Expand</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleGroups.length === 0 && (
            <tr>
              <td colSpan={COLUMN_COUNT} className="sb-color-table__td sb-color-table__empty-row">
                No colors match "{query.trim()}".
              </td>
            </tr>
          )}
          {visibleGroups.map((group) => (
            <GroupRow
              key={group.base}
              group={group}
              selectedLabel={selectedByBase[group.base]}
              expanded={expandedByBase.has(group.base)}
              onToggleExpand={toggleExpand}
              onSelectVariant={selectVariant}
              {...(onSelect !== undefined && { onSelect })}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRow({
  group,
  selectedLabel,
  expanded,
  onToggleExpand,
  onSelectVariant,
  onSelect,
}: {
  group: Group;
  selectedLabel: string | undefined;
  expanded: boolean;
  onToggleExpand(base: string): void;
  onSelectVariant(base: string, label: string): void;
  onSelect?(path: string): void;
}): ReactElement {
  const multi = group.variants.length > 1;
  const active =
    group.variants.find((v) => v.label === selectedLabel) ?? (group.variants[0] as Variant);
  const nameText = multi ? group.base : active.path;

  const handleRowActivate = (): void => {
    if (onSelect) onSelect(active.path);
    else onToggleExpand(group.base);
  };

  return (
    <Fragment>
      <tr
        className={cx('sb-color-table__row', {
          'sb-color-table__row--expanded': expanded,
        })}
        onClick={handleRowActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowActivate();
          }
        }}
        tabIndex={0}
        aria-label={
          onSelect
            ? `Inspect ${active.path}`
            : expanded
              ? `Collapse ${group.base}`
              : `Expand ${group.base}`
        }
        data-testid="color-table-row"
        data-path={active.path}
        data-base={group.base}
      >
        <td className="sb-color-table__td sb-color-table__swatch-cell">
          <span
            className="sb-color-table__swatch"
            style={{ background: active.cssVar }}
            aria-hidden
          />
        </td>
        <td className={cx('sb-color-table__td', 'sb-color-table__path')}>
          <span className="sb-color-table__path-text">{nameText}</span>
          {multi && (
            <span
              className="sb-color-table__variant-pills"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              {group.variants.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  className={cx('sb-color-table__variant-pill', {
                    'sb-color-table__variant-pill--active': v.label === active.label,
                  })}
                  onClick={() => onSelectVariant(group.base, v.label)}
                  aria-pressed={v.label === active.label}
                  data-testid="color-table-variant"
                  data-variant={v.label}
                >
                  {v.label}
                </button>
              ))}
            </span>
          )}
        </td>
        <ValueCell value={active.value} label={`Copy value ${active.value}`}>
          {active.outOfGamut && (
            <span
              title="Out of sRGB gamut for this format"
              aria-label="out of gamut"
              className="sb-color-table__gamut-warn"
            >
              ⚠
            </span>
          )}
        </ValueCell>
        <ValueCell value={active.cssVar} label={`Copy CSS var ${active.cssVar}`} />
        <td className="sb-color-table__td sb-color-table__alias">
          {active.aliasOf ? (
            <span className="sb-color-table__alias-text">{active.aliasOf}</span>
          ) : (
            <span className="sb-color-table__alias-empty" aria-hidden>
              —
            </span>
          )}
        </td>
        <td className="sb-color-table__td sb-color-table__expand-cell">
          {!onSelect && (
            <span
              className={cx('sb-color-table__chevron', {
                'sb-color-table__chevron--expanded': expanded,
              })}
              aria-hidden
            >
              ▸
            </span>
          )}
        </td>
      </tr>
      {expanded && !onSelect && (
        <tr className="sb-color-table__detail-row" data-testid="color-table-detail">
          <td colSpan={COLUMN_COUNT} className="sb-color-table__td sb-color-table__detail-cell">
            <ExpandedDetail group={group} active={active} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function ExpandedDetail({ group, active }: { group: Group; active: Variant }): ReactElement {
  const hasDescription = active.description !== undefined && active.description.length > 0;
  const chain = active.aliasChain && active.aliasChain.length > 0 ? active.aliasChain : undefined;
  const multi = group.variants.length > 1;

  return (
    <div className="sb-color-table__detail">
      {hasDescription && <p className="sb-color-table__description">{active.description}</p>}
      {chain && (
        <p className="sb-color-table__chain">
          <span className="sb-color-table__detail-label">Alias chain:</span> {chain.join(' → ')}
        </p>
      )}
      {multi && (
        <div className="sb-color-table__variant-grid">
          <div className="sb-color-table__variant-grid-header">All variants</div>
          <table className="sb-color-table__subtable">
            <thead>
              <tr>
                <th className="sb-color-table__subth">Variant</th>
                <th className="sb-color-table__subth">Path</th>
                <th className="sb-color-table__subth">HEX</th>
                <th className="sb-color-table__subth">HSL</th>
                <th className="sb-color-table__subth">OKLCH</th>
              </tr>
            </thead>
            <tbody>
              {group.variants.map((v) => (
                <tr
                  key={v.label}
                  className={cx({
                    'sb-color-table__subrow--active': v.label === active.label,
                  })}
                >
                  <td className="sb-color-table__subtd">{v.label}</td>
                  <td className="sb-color-table__subtd sb-color-table__subtd--path">{v.path}</td>
                  <td className="sb-color-table__subtd">{v.hex}</td>
                  <td className="sb-color-table__subtd">{v.hsl}</td>
                  <td className="sb-color-table__subtd">{v.oklch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!hasDescription && !chain && !multi && (
        <p className="sb-color-table__detail-empty">
          No description or alias chain authored for this token.
        </p>
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

type FormatColorResult = ReturnType<typeof formatColor>;

/**
 * Pick the value + gamut flag to display in the single Value column based
 * on the active color-format context. We pre-compute hex/hsl/oklch for the
 * expanded sub-table regardless; the extras (`rgb`, `raw`) take a fresh
 * `formatColor` pass. Keeps the hot path fast while staying honest about
 * out-of-gamut warnings per-format.
 */
function pickActiveFormat(
  raw: NormalizedColor,
  colorFormat: ColorFormat,
  hex: FormatColorResult,
  hsl: FormatColorResult,
  oklch: FormatColorResult,
): { value: string; outOfGamut: boolean } {
  switch (colorFormat) {
    case 'hex':
      return { value: hex.value, outOfGamut: hex.outOfGamut };
    case 'hsl':
      return { value: hsl.value, outOfGamut: hsl.outOfGamut };
    case 'oklch':
      return { value: oklch.value, outOfGamut: oklch.outOfGamut };
    default: {
      const extra = formatColor(raw, colorFormat);
      return { value: extra.value, outOfGamut: extra.outOfGamut };
    }
  }
}

interface VariantEntry {
  label: string;
  suffix: string;
}

interface VariantDefs {
  /** Match iteration order — longest suffix first. */
  matchOrder: readonly VariantEntry[];
  /** Display iteration order — preserves the caller's declared order. */
  displayOrder: readonly string[];
}

function buildVariantDefs(variants: Record<string, string> | undefined): VariantDefs {
  if (!variants) return { matchOrder: [], displayOrder: [] };
  const entries: VariantEntry[] = [];
  const displayOrder: string[] = [];
  for (const [label, suffix] of Object.entries(variants)) {
    if (suffix.length === 0) continue;
    entries.push({ label, suffix });
    displayOrder.push(label);
  }
  const matchOrder = entries.toSorted((a, b) => b.suffix.length - a.suffix.length);
  return { matchOrder, displayOrder };
}

/**
 * Position of a label within a group — the `base` entry always sorts first,
 * then declared labels in the order the caller wrote them in the `variants`
 * prop. Unknown labels (shouldn't happen in practice) fall to the end.
 */
function orderIndex(label: string, defs: VariantDefs): number {
  if (label === BASE_LABEL) return -1;
  const idx = defs.displayOrder.indexOf(label);
  return idx >= 0 ? idx : Number.POSITIVE_INFINITY;
}

/**
 * Resolve the variant label + base path for a token, if any. The leaf
 * (last dot-segment) must either equal the suffix outright (dot-segment
 * form: `hi.disabled` matches suffix `disabled`) or end in `-<suffix>`
 * (hyphen-tail form: `hi-d` matches `d`). The leading hyphen is required
 * for the tail form so suffix `0` can't hit `neutral-900` by character.
 *
 * Returned `basePath` is what gets used as the grouping key:
 * - Dot-segment match → parent path (drop the last dot-segment)
 * - Hyphen-tail match → same dot-depth, leaf with `-<suffix>` stripped
 *
 * Entries in `matchOrder` are pre-sorted longest-first, so `h-dark` wins
 * over `dark` for a path ending in `-h-dark`.
 */
function matchVariant(
  path: string,
  matchOrder: readonly VariantEntry[],
): { label: string; basePath: string } | undefined {
  if (matchOrder.length === 0) return undefined;
  const segments = path.split('.');
  const leaf = segments.at(-1) ?? path;
  for (const entry of matchOrder) {
    if (leaf === entry.suffix) {
      const parent = segments.slice(0, -1).join('.');
      if (parent.length === 0) continue;
      return { label: entry.label, basePath: parent };
    }
    const tailMarker = `-${entry.suffix}`;
    if (leaf.endsWith(tailMarker)) {
      const trimmed = leaf.slice(0, -tailMarker.length);
      if (trimmed.length === 0) continue;
      const copy = segments.slice(0, -1);
      copy.push(trimmed);
      return { label: entry.label, basePath: copy.join('.') };
    }
  }
  return undefined;
}
