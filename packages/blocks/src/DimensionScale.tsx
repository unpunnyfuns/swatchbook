import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './DimensionScale.css';
import { DimensionBar } from '#/dimension-scale/DimensionBar.tsx';
import type { DimensionVisual } from '#/dimension-scale/DimensionBar.tsx';
import { useRootFontSize } from '#/internal/use-root-font-size.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

export type { DimensionVisual };

export interface DimensionScaleProps {
  /**
   * Token-path filter. Defaults to every `dimension` token. Use e.g.
   * `"space.*"` to scope to the spacing scale.
   */
  filter?: string;
  /**
   * Visualization kind:
   * - `'length'` (default): horizontal bar whose width equals the token's dimension.
   * - `'radius'`: 56×56 square with the token applied as `border-radius`.
   * - `'size'`: a square sized to the token's dimension.
   */
  visual?: DimensionVisual;
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

export interface DimensionRow {
  path: string;
  cssVar: string;
  displayValue: string;
}

export interface DeriveDimensionRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
  rootFontSizePx: number;
}

/**
 * Pure derivation of the scale's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveDimensionRows(
  resolved: ProjectData['resolved'],
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
  { filter, sortBy, sortDir, rootFontSizePx }: DeriveDimensionRowsOptions,
): DimensionRow[] {
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'dimension') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir, rootFontSizePx }).map(
    ([path, token]) => ({
      path,
      cssVar: resolveCssVar(path, project),
      displayValue: formatTokenValue(token.$value, token.$type, 'raw', project.listing[path]),
    }),
  );
}

export interface DimensionScaleViewProps {
  rows: DimensionRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  visual: DimensionVisual;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the dimension scale. Renders from plain props;
 * composes the connected `DimensionBar` as a child (that child reads the
 * project itself).
 */
export function DimensionScaleView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  visual,
  filter,
  caption,
}: DimensionScaleViewProps): ReactElement {
  const captionText =
    caption ??
    `${rows.length} dimension${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No dimension tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-dimension-scale__row">
          <div className="sb-dimension-scale__meta">
            <span className="sb-dimension-scale__path">{row.path}</span>
            <span className="sb-dimension-scale__specs">{row.displayValue}</span>
          </div>
          <div className="sb-dimension-scale__visual-cell">
            <DimensionBar path={row.path} visual={visual} />
          </div>
          <span className="sb-dimension-scale__css-var">{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}

export function DimensionScale({
  filter,
  visual = 'length',
  caption,
  sortBy = 'value',
  sortDir = 'asc',
}: DimensionScaleProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = project;
  const rootFontSize = useRootFontSize();

  const rows = useMemo(
    () =>
      deriveDimensionRows(resolved, project, {
        filter,
        sortBy,
        sortDir,
        rootFontSizePx: rootFontSize,
      }),
    [resolved, project, filter, sortBy, sortDir, rootFontSize],
  );

  return (
    <DimensionScaleView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      visual={visual}
      filter={filter}
      caption={caption}
    />
  );
}
