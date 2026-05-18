import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './GradientPalette.css';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

export interface GradientPaletteProps {
  /**
   * Token-path filter. Defaults to every `gradient` token. Use e.g.
   * `"gradient.*"` or `"gradient.accent"` to scope.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order. `'path'` (default) sorts lexicographically on the
   * dot-path; `'value'` falls through to path (gradients don't have
   * a single-axis ordering); `'none'` preserves project order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

interface GradientStop {
  color?: {
    colorSpace?: string;
    components?: readonly number[];
    alpha?: number;
  };
  position?: number;
}

interface Row {
  path: string;
  cssVar: string;
  stops: GradientStop[];
}

function asStops(raw: unknown): GradientStop[] {
  if (!Array.isArray(raw)) return [];
  return raw as GradientStop[];
}

const pct = (n: number): string => `${(n * 100).toFixed(3)}%`;

function stopCssColor(stop: GradientStop): string {
  const color = stop.color;
  if (!color || !Array.isArray(color.components) || color.components.length < 3) {
    return 'transparent';
  }
  const [r, g, b] = color.components;
  if (r === undefined || g === undefined || b === undefined) return 'transparent';
  const alpha = color.alpha ?? 1;
  return alpha === 1
    ? `rgb(${pct(r)} ${pct(g)} ${pct(b)})`
    : `rgb(${pct(r)} ${pct(g)} ${pct(b)} / ${alpha})`;
}

function stopKey(path: string, stop: GradientStop, fallback: number): string {
  return `${path}|${stop.position ?? fallback}|${stopCssColor(stop)}`;
}

export function GradientPalette({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: GradientPaletteProps): ReactElement {
  const project = useProject();
  const { resolved, activePermutation, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'gradient') return false;
      return matchPath(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
      path,
      cssVar: resolveCssVar(path, project),
      stops: asStops(token.$value),
    }));
  }, [resolved, filter, project, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} gradient${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activePermutation}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activePermutation)}>
        <div className="sb-block__empty">No gradient tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activePermutation)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-gradient-palette__row">
          <div className="sb-gradient-palette__meta">
            <span className="sb-gradient-palette__path">{row.path}</span>
            <span className="sb-gradient-palette__css-var">{row.cssVar}</span>
          </div>
          <div
            className="sb-gradient-palette__sample"
            style={{ background: `linear-gradient(to right, ${row.cssVar})` }}
            aria-hidden
          />
          <div className="sb-gradient-palette__stops">
            {row.stops.map((stop, i) => (
              <div key={stopKey(row.path, stop, i)} className="sb-gradient-palette__stop-row">
                <span
                  className="sb-gradient-palette__stop-swatch"
                  style={{ background: stopCssColor(stop) }}
                  aria-hidden
                />
                <span>{formatColor(stop.color, colorFormat).value}</span>
                <span className="sb-gradient-palette__stop-position">
                  @ {((stop.position ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
