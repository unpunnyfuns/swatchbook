import type { ReactElement } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { type ColorFormat, formatColor } from '#/format-color.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface CompositeBreakdownProps {
  /** Full dot-path of the token. */
  path: string;
}

export function CompositeBreakdown({ path }: CompositeBreakdownProps): ReactElement | null {
  const { token } = useTokenDetailData(path);
  const colorFormat = useColorFormat();
  if (!token) return null;
  return (
    <CompositeBreakdownContent
      type={token.$type}
      rawValue={token.$value}
      colorFormat={colorFormat}
    />
  );
}

export function CompositeBreakdownContent({
  type,
  rawValue,
  colorFormat,
}: {
  type: string | undefined;
  rawValue: unknown;
  colorFormat: ColorFormat;
}): ReactElement | null {
  if (!rawValue || typeof rawValue !== 'object') return null;

  if (type === 'typography') {
    const v = rawValue as Record<string, unknown>;
    return renderKeyValueList([
      ['fontFamily', formatFontFamily(v['fontFamily'])],
      ['fontSize', formatDimensionValue(v['fontSize'])],
      ['fontWeight', formatPrimitive(v['fontWeight'])],
      ['lineHeight', formatPrimitive(v['lineHeight'])],
      ['letterSpacing', formatDimensionValue(v['letterSpacing'])],
    ]);
  }

  if (type === 'border') {
    const v = rawValue as Record<string, unknown>;
    return renderKeyValueList([
      ['color', formatColorSubValue(v['color'], colorFormat)],
      ['width', formatDimensionValue(v['width'])],
      ['style', formatPrimitive(v['style'])],
    ]);
  }

  if (type === 'transition') {
    const v = rawValue as Record<string, unknown>;
    return renderKeyValueList([
      ['duration', formatDimensionValue(v['duration'])],
      ['timingFunction', formatPrimitive(v['timingFunction'])],
      ['delay', formatDimensionValue(v['delay'])],
    ]);
  }

  if (type === 'shadow') {
    const layers = Array.isArray(rawValue) ? rawValue : [rawValue];
    const multi = layers.length > 1;
    return (
      <div className="sb-token-detail__breakdown-section">
        {layers.map((layer, i) => {
          const v = layer as Record<string, unknown>;
          return (
            <div key={shadowLayerKey(v, i)} style={{ display: 'contents' }}>
              {multi && (
                <div className="sb-token-detail__breakdown-layer-header">Layer {i + 1}</div>
              )}
              <KeyValueRow label="color" value={formatColorSubValue(v['color'], colorFormat)} />
              <KeyValueRow label="offsetX" value={formatDimensionValue(v['offsetX'])} />
              <KeyValueRow label="offsetY" value={formatDimensionValue(v['offsetY'])} />
              <KeyValueRow label="blur" value={formatDimensionValue(v['blur'])} />
              <KeyValueRow label="spread" value={formatDimensionValue(v['spread'])} />
              {'inset' in v && <KeyValueRow label="inset" value={formatPrimitive(v['inset'])} />}
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'gradient') {
    const stops = Array.isArray(rawValue) ? rawValue : [];
    if (stops.length === 0) return null;
    return (
      <div className="sb-token-detail__breakdown-section">
        {stops.map((stop, i) => {
          const v = stop as Record<string, unknown>;
          const position = typeof v['position'] === 'number' ? v['position'] : 0;
          return (
            <KeyValueRow
              key={gradientStopKey(v, i)}
              label={`${(position * 100).toFixed(0)}%`}
              value={formatColorSubValue(v['color'], colorFormat)}
            />
          );
        })}
      </div>
    );
  }

  return null;
}

function renderKeyValueList(rows: Array<[string, string | null]>): ReactElement {
  return (
    <div className="sb-token-detail__breakdown-section">
      {rows
        .filter(([, v]) => v !== null)
        .map(([k, v]) => (
          <KeyValueRow key={k} label={k} value={v ?? ''} />
        ))}
    </div>
  );
}

function KeyValueRow({ label, value }: { label: string; value: string | null }): ReactElement {
  return (
    <>
      <span className="sb-token-detail__breakdown-key">{label}</span>
      <span>{value ?? '—'}</span>
    </>
  );
}

function formatPrimitive(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function formatFontFamily(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(String).join(', ');
  return JSON.stringify(v);
}

function formatDimensionValue(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const d = v as { value?: unknown; unit?: unknown };
    if (typeof d.value === 'number' && typeof d.unit === 'string') return `${d.value}${d.unit}`;
  }
  return JSON.stringify(v);
}

/**
 * Route sub-value colors through `formatColor` so they honor the active
 * color-format dropdown, just like the standalone `<ColorPalette />` and
 * `<TokenDetail />` top-line do. Returns `null` for a missing field so
 * the key/value row drops out entirely.
 */
function formatColorSubValue(v: unknown, format: ColorFormat): string | null {
  if (v == null) return null;
  return formatColor(v, format).value;
}

function shadowLayerKey(layer: Record<string, unknown>, fallback: number): string {
  const parts = [
    layer['color'],
    layer['offsetX'],
    layer['offsetY'],
    layer['blur'],
    layer['spread'],
    layer['inset'],
  ].map((p) => (p === undefined ? '' : JSON.stringify(p)));
  return `shadow|${parts.join('|')}|${fallback}`;
}

function gradientStopKey(stop: Record<string, unknown>, fallback: number): string {
  return `stop|${stop['position'] ?? fallback}|${JSON.stringify(stop['color'])}`;
}
