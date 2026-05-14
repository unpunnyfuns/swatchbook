import cx from 'clsx';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './ShadowPreview.css';
import { useColorFormat } from '#/contexts.ts';
import { type ColorFormat, formatColor } from '#/format-color.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, resolveCssVar, useProject } from '#/internal/use-project.ts';
import { ShadowSample } from '#/shadow-preview/ShadowSample.tsx';

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
}

interface ShadowLayer {
  color?: unknown;
  offsetX?: unknown;
  offsetY?: unknown;
  blur?: unknown;
  spread?: unknown;
  inset?: unknown;
}

interface Row {
  path: string;
  cssVar: string;
  layers: ShadowLayer[];
}

function formatDimension(raw: unknown): string {
  if (raw == null) return '—';
  if (typeof raw === 'number') return String(raw);
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const v = raw as { value?: unknown; unit?: unknown };
    if (typeof v.value === 'number' && typeof v.unit === 'string') {
      return `${v.value}${v.unit}`;
    }
  }
  return JSON.stringify(raw);
}

function formatSubColor(raw: unknown, format: ColorFormat): string {
  if (raw == null) return '—';
  return formatColor(raw, format).value;
}

function asLayers(raw: unknown): ShadowLayer[] {
  if (Array.isArray(raw)) return raw as ShadowLayer[];
  if (raw && typeof raw === 'object') return [raw as ShadowLayer];
  return [];
}

function layerKey(path: string, layer: ShadowLayer, fallback: number): string {
  const off = `${formatDimension(layer.offsetX)},${formatDimension(layer.offsetY)}`;
  const blur = formatDimension(layer.blur);
  const spread = formatDimension(layer.spread);
  return `${path}|${off}|${blur}|${spread}|${fallback}`;
}

export function ShadowPreview({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: ShadowPreviewProps): ReactElement {
  const project = useProject();
  const { resolved, activePermutation, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'shadow') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
      path,
      cssVar: resolveCssVar(path, project),
      layers: asLayers(token.$value),
    }));
  }, [resolved, filter, project, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} shadow${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activePermutation}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activePermutation)}>
        <div className="sb-block__empty">No shadow tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activePermutation)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-shadow-preview__row">
          <div className="sb-shadow-preview__meta">
            <span className="sb-shadow-preview__path">{row.path}</span>
            <span className="sb-shadow-preview__css-var">{row.cssVar}</span>
          </div>
          <div className="sb-shadow-preview__sample-cell">
            <ShadowSample path={row.path} />
          </div>
          <div className="sb-shadow-preview__breakdown">
            {row.layers.length === 1
              ? renderLayer(row.layers[0], colorFormat)
              : row.layers.map((layer, i) => (
                  <Layer
                    key={layerKey(row.path, layer, i)}
                    layer={layer}
                    index={i}
                    total={row.layers.length}
                    colorFormat={colorFormat}
                  />
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderLayer(layer: ShadowLayer | undefined, format: ColorFormat): ReactElement[] {
  if (!layer) return [];
  const entries: [string, string][] = [
    ['offset', `${formatDimension(layer.offsetX)} ${formatDimension(layer.offsetY)}`],
    ['blur', formatDimension(layer.blur)],
    ['spread', formatDimension(layer.spread)],
    ['color', formatSubColor(layer.color, format)],
  ];
  if (layer.inset) entries.push(['inset', String(layer.inset)]);
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
  colorFormat,
}: {
  layer: ShadowLayer;
  index: number;
  total: number;
  colorFormat: ColorFormat;
}): ReactElement {
  return (
    <div className="sb-shadow-preview__layer">
      <div className="sb-shadow-preview__layer-header">
        layer {index + 1} of {total}
      </div>
      <div className={cx('sb-shadow-preview__breakdown', 'sb-shadow-preview__layer-breakdown')}>
        {renderLayer(layer, colorFormat)}
      </div>
    </div>
  );
}
