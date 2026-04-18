import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';
import { ShadowSample } from '#/shadow-preview/ShadowSample.tsx';

export interface ShadowPreviewProps {
  /**
   * Token-path filter. Defaults to every `shadow` token. Use e.g.
   * `"shadow.sys.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
}

const styles = {
  wrapper: {
    fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
    fontSize: 'var(--sb-typography-sys-body-font-size, 14px)',
    color: 'var(--sb-color-sys-text-default, CanvasText)',
    background: 'var(--sb-color-sys-surface-default, Canvas)',
    padding: 12,
    borderRadius: 6,
  } satisfies CSSProperties,
  caption: {
    padding: '4px 0 12px',
    opacity: 0.7,
    fontSize: 12,
  } satisfies CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 140px 1fr',
    gap: 16,
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  } satisfies CSSProperties,
  path: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    opacity: 0.7,
  } satisfies CSSProperties,
  sampleCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 96,
  } satisfies CSSProperties,
  breakdown: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 12,
    rowGap: 2,
  } satisfies CSSProperties,
  breakdownKey: {
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  layerHeader: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    marginTop: 6,
  } satisfies CSSProperties,
  empty: {
    padding: '24px 12px',
    textAlign: 'center',
    opacity: 0.6,
  } satisfies CSSProperties,
};

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

function formatColor(raw: unknown): string {
  if (raw == null) return '—';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const v = raw as { components?: unknown; alpha?: unknown; colorSpace?: unknown };
    if (Array.isArray(v.components) && typeof v.colorSpace === 'string') {
      const parts = v.components.map((c) => (typeof c === 'number' ? c.toFixed(3) : String(c)));
      const alpha = typeof v.alpha === 'number' && v.alpha !== 1 ? `, ${v.alpha}` : '';
      return `${v.colorSpace}(${parts.join(' ')}${alpha})`;
    }
  }
  return JSON.stringify(raw);
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

export function ShadowPreview({ filter = 'shadow', caption }: ShadowPreviewProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo(() => {
    const collected: Row[] = [];
    for (const [path, token] of Object.entries(resolved)) {
      if (token.$type !== 'shadow') continue;
      if (!globMatch(path, filter)) continue;
      collected.push({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        layers: asLayers(token.$value),
      });
    }
    collected.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
    return collected;
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} shadow${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.empty}>No shadow tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <div style={styles.caption}>{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} style={styles.row}>
          <div style={styles.meta}>
            <span style={styles.path}>{row.path}</span>
            <span style={styles.cssVar}>{row.cssVar}</span>
          </div>
          <div style={styles.sampleCell}>
            <ShadowSample path={row.path} />
          </div>
          <div style={styles.breakdown}>
            {row.layers.length === 1
              ? renderLayer(row.layers[0])
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

function renderLayer(layer: ShadowLayer | undefined): ReactElement[] {
  if (!layer) return [];
  const entries: [string, string][] = [
    ['offset', `${formatDimension(layer.offsetX)} ${formatDimension(layer.offsetY)}`],
    ['blur', formatDimension(layer.blur)],
    ['spread', formatDimension(layer.spread)],
    ['color', formatColor(layer.color)],
  ];
  if (layer.inset) entries.push(['inset', String(layer.inset)]);
  return entries.flatMap(([k, v]) => [
    <span key={`k-${k}`} style={styles.breakdownKey}>
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
  layer: ShadowLayer;
  index: number;
  total: number;
}): ReactElement {
  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <div style={styles.layerHeader}>
        layer {index + 1} of {total}
      </div>
      <div style={{ ...styles.breakdown, marginTop: 2 }}>{renderLayer(layer)}</div>
    </div>
  );
}
