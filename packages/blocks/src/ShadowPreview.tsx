import cx from 'clsx';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './ShadowPreview.css';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import { formatDimension, formatSubColor } from '#/internal/composite-sample-format.ts';
import type { RealisedToken, ShadowLayer } from '#/internal/composite-types.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { usePresenter } from '#/presenters/registry.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

export interface ShadowPreviewProps {
  /**
   * Token-path filter. Defaults to every `shadow` token. Use e.g.
   * `"shadow.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order. `'path'` (default) sorts lexicographically on the
   * dot-path; `'value'` falls through to path (shadows don't have a
   * single-axis ordering); `'none'` preserves project order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
  /**
   * Highest-precedence color format for this preview's values, overriding
   * an outer `ColorFormatContext` and the project's `defaultColorFormat`.
   * Omit to inherit the existing precedence chain (see `useColorFormat`).
   */
  colorFormat?: ColorFormat;
}

/** One shadow layer's breakdown fields, formatted for display. */
export interface ShadowLayerRow {
  offset: string;
  blur: string;
  spread: string;
  color: string;
  inset?: string | undefined;
}

export interface ShadowRow {
  path: string;
  cssVar: string;
  /** Realised token, fed to `ShadowSample` per the presenter contract. */
  token: RealisedToken<'shadow'>;
  layers: ShadowLayerRow[];
}

export interface DeriveShadowRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
  colorFormat: ColorFormat;
}

function layerKey(path: string, layer: ShadowLayerRow, fallback: number): string {
  return `${path}|${layer.offset}|${layer.blur}|${layer.spread}|${fallback}`;
}

function asLayers(raw: unknown): ShadowLayer[] {
  if (Array.isArray(raw)) return raw as ShadowLayer[];
  if (raw && typeof raw === 'object') return [raw as ShadowLayer];
  return [];
}

function formatLayer(layer: ShadowLayer, colorFormat: ColorFormat): ShadowLayerRow {
  return {
    offset: `${formatDimension(layer.offsetX)} ${formatDimension(layer.offsetY)}`,
    blur: formatDimension(layer.blur),
    spread: formatDimension(layer.spread),
    color: formatSubColor(layer.color, colorFormat),
    inset: layer.inset ? String(layer.inset) : undefined,
  };
}

/**
 * Pure derivation of the preview's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveShadowRows(
  resolved: ProjectData['resolved'],
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
  { filter, sortBy, sortDir, colorFormat }: DeriveShadowRowsOptions,
): ShadowRow[] {
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'shadow') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
    path,
    cssVar: resolveCssVar(path, project),
    token: token as RealisedToken<'shadow'>,
    layers: asLayers(token.$value).map((layer) => formatLayer(layer, colorFormat)),
  }));
}

export interface ShadowPreviewViewProps {
  rows: ShadowRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  /** Forwarded to each row's `ShadowSample` for its realised-CSS branch. */
  colorFormat: ColorFormat;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the shadow preview. Renders from plain props;
 * composes the connected `ShadowSample` as a child, feeding it this row's
 * already-resolved `token`/`cssVar` per the presenter contract.
 */
export function ShadowPreviewView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  colorFormat,
  filter,
  caption,
}: ShadowPreviewViewProps): ReactElement {
  const Sample = usePresenter('shadow');
  const captionText =
    caption ??
    `${rows.length} shadow${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No shadow tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-shadow-preview__row">
          <div className="sb-shadow-preview__meta">
            <span className="sb-shadow-preview__path">{row.path}</span>
            <span className="sb-shadow-preview__css-var">{row.cssVar}</span>
          </div>
          <div className="sb-shadow-preview__sample-cell">
            {Sample && (
              <Sample
                path={row.path}
                token={row.token}
                cssVar={row.cssVar}
                colorFormat={colorFormat}
              />
            )}
          </div>
          <div className="sb-shadow-preview__breakdown">
            {row.layers.length === 1
              ? renderLayerEntries(row.layers[0])
              : row.layers.map((layer, i) => (
                  <Layer
                    key={layerKey(row.path, layer, i)}
                    layer={layer}
                    index={i}
                    total={row.layers.length}
                  />
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderLayerEntries(layer: ShadowLayerRow | undefined): ReactElement[] {
  if (!layer) return [];
  const entries: [string, string][] = [
    ['offset', layer.offset],
    ['blur', layer.blur],
    ['spread', layer.spread],
    ['color', layer.color],
  ];
  if (layer.inset) entries.push(['inset', layer.inset]);
  return entries.flatMap(([k, v]) => [
    <span key={`k-${k}`} className="sb-shadow-preview__breakdown-key">
      {k}
    </span>,
    <span key={`v-${k}`}>{v}</span>,
  ]);
}

function Layer({
  layer,
  index,
  total,
}: {
  layer: ShadowLayerRow;
  index: number;
  total: number;
}): ReactElement {
  return (
    <div className="sb-shadow-preview__layer">
      <div className="sb-shadow-preview__layer-header">
        layer {index + 1} of {total}
      </div>
      <div className={cx('sb-shadow-preview__breakdown', 'sb-shadow-preview__layer-breakdown')}>
        {renderLayerEntries(layer)}
      </div>
    </div>
  );
}

export function ShadowPreview({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
  colorFormat,
}: ShadowPreviewProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = project;
  const contextColorFormat = useColorFormat();
  const format = colorFormat ?? contextColorFormat;

  const rows = useMemo(
    () =>
      deriveShadowRows(resolved, project, {
        filter,
        sortBy,
        sortDir,
        colorFormat: format,
      }),
    [resolved, project, filter, sortBy, sortDir, format],
  );

  return (
    <ShadowPreviewView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      colorFormat={format}
      filter={filter}
      caption={caption}
    />
  );
}
