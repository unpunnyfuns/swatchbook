import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './GradientPalette.css';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import type { ColorFormat } from '#/format-color.ts';
import { parseColor } from '@unpunnyfuns/swatchbook-core/format-color';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
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
  /**
   * Highest-precedence color format for this palette's values, overriding
   * an outer `ColorFormatContext` and the project's `defaultColorFormat`.
   * Omit to inherit the existing precedence chain (see `useColorFormat`).
   */
  colorFormat?: ColorFormat;
}

interface GradientStop {
  color?: {
    colorSpace?: string;
    components?: readonly number[];
    alpha?: number;
  };
  position?: number;
}

export interface GradientRowStop {
  key: string;
  cssColor: string;
  value: string;
  positionPercent: string;
}

export interface GradientRow {
  path: string;
  cssVar: string;
  stops: GradientRowStop[];
}

function asStops(raw: unknown): GradientStop[] {
  if (!Array.isArray(raw)) return [];
  return raw as GradientStop[];
}

function stopCssColor(stop: GradientStop): string {
  // parseColor respects the stop's colorSpace (via the colorjs space-alias
  // map) and emits a gamut-correct CSS string — e.g. `color(display-p3 …)`
  // for a P3 stop — rather than the old code's raw sRGB-percentage rendering
  // that mislabeled every non-sRGB stop.
  const color = parseColor(stop.color);
  if (!color) return 'transparent';
  return color.toString();
}

function stopKey(path: string, stop: GradientStop, fallback: number): string {
  return `${path}|${stop.position ?? fallback}|${stopCssColor(stop)}`;
}

export interface DeriveGradientRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
  colorFormat: ColorFormat;
}

/**
 * Pure derivation of the palette's gradient rows from resolved project
 * data. Extracted so it is unit-testable without React or a store.
 */
export function deriveGradientRows(
  resolved: ProjectData['resolved'],
  listing: ProjectData['listing'],
  cssVarPrefix: ProjectData['cssVarPrefix'],
  { filter, sortBy, sortDir, colorFormat }: DeriveGradientRowsOptions,
): GradientRow[] {
  const projectFields = { listing, cssVarPrefix };
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'gradient') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => {
    const stops = asStops(token.$value);
    return {
      path,
      cssVar: resolveCssVar(path, projectFields),
      stops: stops.map((stop, i) => ({
        key: stopKey(path, stop, i),
        cssColor: stopCssColor(stop),
        value: formatColor(stop.color, colorFormat).value,
        positionPercent: ((stop.position ?? 0) * 100).toFixed(0),
      })),
    };
  });
}

export interface GradientPaletteViewProps {
  rows: GradientRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  filter?: string | undefined;
  caption?: string | undefined;
}

/** Pure presentation for the gradient palette. Renders from plain props. */
export function GradientPaletteView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  filter,
  caption,
}: GradientPaletteViewProps): ReactElement {
  const captionText =
    caption ??
    `${rows.length} gradient${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No gradient tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
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
            {row.stops.map((stop) => (
              <div key={stop.key} className="sb-gradient-palette__stop-row">
                <span
                  className="sb-gradient-palette__stop-swatch"
                  style={{ background: stop.cssColor }}
                  aria-hidden
                />
                <span>{stop.value}</span>
                <span className="sb-gradient-palette__stop-position">
                  @ {stop.positionPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GradientPalette({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
  colorFormat,
}: GradientPaletteProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix, listing } = project;
  const contextColorFormat = useColorFormat();
  const format = colorFormat ?? contextColorFormat;

  const rows = useMemo(
    () =>
      deriveGradientRows(resolved, listing, cssVarPrefix, {
        filter,
        sortBy,
        sortDir,
        colorFormat: format,
      }),
    [resolved, listing, cssVarPrefix, filter, sortBy, sortDir, format],
  );

  return (
    <GradientPaletteView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      filter={filter}
      caption={caption}
    />
  );
}
