import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './DimensionScale.css';
import { DimensionBar } from '#/dimension-scale/DimensionBar.tsx';
import type { DimensionVisual } from '#/dimension-scale/DimensionBar.tsx';
import { MAX_RENDER_PX, toPixels } from '#/dimension-scale/dimension-px.ts';
import { useRootFontSize } from '#/internal/use-root-font-size.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
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

interface Row {
  path: string;
  cssVar: string;
  displayValue: string;
  pxValue: number;
  capped: boolean;
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

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'dimension') return false;
      return matchPath(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir, rootFontSizePx: rootFontSize }).map(
      ([path, token]) => {
        const pxValue = toPixels(token.$value, rootFontSize);
        return {
          path,
          cssVar: resolveCssVar(path, project),
          displayValue: formatTokenValue(token.$value, token.$type, 'raw', project.listing[path]),
          pxValue,
          capped: Number.isFinite(pxValue) && pxValue > MAX_RENDER_PX,
        };
      },
    );
  }, [resolved, filter, project, sortBy, sortDir, rootFontSize]);

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
            {row.capped && (
              <span className="sb-dimension-scale__cap">capped at {MAX_RENDER_PX}px</span>
            )}
          </div>
          <span className="sb-dimension-scale__css-var">{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
