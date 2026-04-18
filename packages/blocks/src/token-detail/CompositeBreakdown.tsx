import type { ReactElement } from 'react';
import { styles } from '#/token-detail/styles.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface CompositeBreakdownProps {
  /** Full dot-path of the token. */
  path: string;
}

export function CompositeBreakdown({ path }: CompositeBreakdownProps): ReactElement | null {
  const { token } = useTokenDetailData(path);
  if (!token) return null;
  return <CompositeBreakdownContent type={token.$type} rawValue={token.$value} />;
}

export function CompositeBreakdownContent({
  type,
  rawValue,
}: {
  type: string | undefined;
  rawValue: unknown;
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
      ['color', formatColorValue(v['color'])],
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
      <div style={styles.breakdownSection}>
        {layers.map((layer, i) => {
          const v = layer as Record<string, unknown>;
          return (
            <div key={shadowLayerKey(v, i)} style={{ display: 'contents' }}>
              {multi && <div style={styles.breakdownLayerHeader}>Layer {i + 1}</div>}
              <KeyValueRow label='color' value={formatColorValue(v['color'])} />
              <KeyValueRow label='offsetX' value={formatDimensionValue(v['offsetX'])} />
              <KeyValueRow label='offsetY' value={formatDimensionValue(v['offsetY'])} />
              <KeyValueRow label='blur' value={formatDimensionValue(v['blur'])} />
              <KeyValueRow label='spread' value={formatDimensionValue(v['spread'])} />
              {'inset' in v && <KeyValueRow label='inset' value={formatPrimitive(v['inset'])} />}
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
      <div style={styles.breakdownSection}>
        {stops.map((stop, i) => {
          const v = stop as Record<string, unknown>;
          const position = typeof v['position'] === 'number' ? v['position'] : 0;
          return (
            <KeyValueRow
              key={gradientStopKey(v, i)}
              label={`${(position * 100).toFixed(0)}%`}
              value={formatColorValue(v['color'])}
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
    <div style={styles.breakdownSection}>
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
      <span style={styles.breakdownKey}>{label}</span>
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

function formatColorValue(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    const c = v as { colorSpace?: unknown; components?: unknown; alpha?: unknown };
    if (Array.isArray(c.components) && typeof c.colorSpace === 'string') {
      const parts = c.components.map((n) => (typeof n === 'number' ? n.toFixed(3) : String(n)));
      const alpha = typeof c.alpha === 'number' && c.alpha !== 1 ? ` / ${c.alpha}` : '';
      return `${c.colorSpace}(${parts.join(' ')}${alpha})`;
    }
  }
  return JSON.stringify(v);
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
