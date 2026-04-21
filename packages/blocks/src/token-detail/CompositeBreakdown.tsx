import type { ReactElement } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { type ColorFormat, formatColor } from '#/format-color.ts';
import { type DetailToken, useTokenDetailData } from '#/token-detail/internal.ts';

export interface CompositeBreakdownProps {
  /** Full dot-path of the token. */
  path: string;
}

export function CompositeBreakdown({ path }: CompositeBreakdownProps): ReactElement | null {
  const { token, resolved } = useTokenDetailData(path);
  const colorFormat = useColorFormat();
  if (!token) return null;
  return (
    <CompositeBreakdownContent
      type={token.$type}
      rawValue={token.$value}
      partialAliasOf={token.partialAliasOf}
      resolved={resolved}
      colorFormat={colorFormat}
    />
  );
}

export function CompositeBreakdownContent({
  type,
  rawValue,
  partialAliasOf,
  resolved,
  colorFormat,
}: {
  type: string | undefined;
  rawValue: unknown;
  partialAliasOf?: unknown;
  resolved?: Record<string, DetailToken>;
  colorFormat: ColorFormat;
}): ReactElement | null {
  if (!rawValue || typeof rawValue !== 'object') return null;

  const objectAliases = pickObjectAliases(partialAliasOf);
  const arrayAliases = pickArrayAliases(partialAliasOf);
  const aliasFor = (key: string): readonly string[] | undefined =>
    subValueChain(objectAliases?.[key], resolved);

  if (type === 'typography') {
    const v = rawValue as Record<string, unknown>;
    return renderKeyValueList([
      ['fontFamily', formatFontFamily(v['fontFamily']), aliasFor('fontFamily')],
      ['fontSize', formatDimensionValue(v['fontSize']), aliasFor('fontSize')],
      ['fontWeight', formatPrimitive(v['fontWeight']), aliasFor('fontWeight')],
      ['lineHeight', formatPrimitive(v['lineHeight']), aliasFor('lineHeight')],
      ['letterSpacing', formatDimensionValue(v['letterSpacing']), aliasFor('letterSpacing')],
    ]);
  }

  if (type === 'border') {
    const v = rawValue as Record<string, unknown>;
    return renderKeyValueList([
      ['color', formatColorSubValue(v['color'], colorFormat), aliasFor('color')],
      ['width', formatDimensionValue(v['width']), aliasFor('width')],
      ['style', formatPrimitive(v['style']), aliasFor('style')],
    ]);
  }

  if (type === 'transition') {
    const v = rawValue as Record<string, unknown>;
    return renderKeyValueList([
      ['duration', formatDimensionValue(v['duration']), aliasFor('duration')],
      ['timingFunction', formatPrimitive(v['timingFunction']), aliasFor('timingFunction')],
      ['delay', formatDimensionValue(v['delay']), aliasFor('delay')],
    ]);
  }

  if (type === 'shadow') {
    const layers = Array.isArray(rawValue) ? rawValue : [rawValue];
    const multi = layers.length > 1;
    const layerAliasFor = (i: number, key: string): readonly string[] | undefined =>
      subValueChain(arrayAliases?.[i]?.[key], resolved);
    return (
      <div className="sb-token-detail__breakdown-section">
        {layers.map((layer, i) => {
          const v = layer as Record<string, unknown>;
          return (
            <div key={shadowLayerKey(v, i)} style={{ display: 'contents' }}>
              {multi && (
                <div className="sb-token-detail__breakdown-layer-header">Layer {i + 1}</div>
              )}
              <KeyValueRow
                label="color"
                value={formatColorSubValue(v['color'], colorFormat)}
                alias={layerAliasFor(i, 'color')}
              />
              <KeyValueRow
                label="offsetX"
                value={formatDimensionValue(v['offsetX'])}
                alias={layerAliasFor(i, 'offsetX')}
              />
              <KeyValueRow
                label="offsetY"
                value={formatDimensionValue(v['offsetY'])}
                alias={layerAliasFor(i, 'offsetY')}
              />
              <KeyValueRow
                label="blur"
                value={formatDimensionValue(v['blur'])}
                alias={layerAliasFor(i, 'blur')}
              />
              <KeyValueRow
                label="spread"
                value={formatDimensionValue(v['spread'])}
                alias={layerAliasFor(i, 'spread')}
              />
              {'inset' in v && (
                <KeyValueRow
                  label="inset"
                  value={formatPrimitive(v['inset'])}
                  alias={undefined}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'gradient') {
    const stops = Array.isArray(rawValue) ? rawValue : [];
    if (stops.length === 0) return null;
    const stopAliasFor = (i: number): readonly string[] | undefined =>
      subValueChain(arrayAliases?.[i]?.['color'], resolved);
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
              alias={stopAliasFor(i)}
            />
          );
        })}
      </div>
    );
  }

  return null;
}

function renderKeyValueList(
  rows: Array<[string, string | null, readonly string[] | undefined]>,
): ReactElement {
  return (
    <div className="sb-token-detail__breakdown-section">
      {rows
        .filter(([, v, alias]) => v !== null || (alias && alias.length > 0))
        .map(([k, v, alias]) => (
          <KeyValueRow key={k} label={k} value={v ?? ''} alias={alias} />
        ))}
    </div>
  );
}

function KeyValueRow({
  label,
  value,
  alias,
}: {
  label: string;
  value: string | null;
  alias: readonly string[] | undefined;
}): ReactElement {
  const hasAlias = alias && alias.length > 0;
  return (
    <>
      <span className="sb-token-detail__breakdown-key">{label}</span>
      <span className="sb-token-detail__breakdown-value">
        <span>{value ?? '—'}</span>
        {hasAlias && (
          <span className="sb-token-detail__breakdown-alias" data-testid="breakdown-alias">
            {alias.map((p, i) => (
              <span key={p} className="sb-token-detail__breakdown-alias-step">
                {i > 0 && <span className="sb-token-detail__arrow">→</span>}
                <span className="sb-token-detail__chain-node">{p}</span>
              </span>
            ))}
          </span>
        )}
      </span>
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

function pickObjectAliases(v: unknown): Record<string, string | undefined> | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  return v as Record<string, string | undefined>;
}

function pickArrayAliases(v: unknown): Array<Record<string, string | undefined>> | undefined {
  if (!Array.isArray(v)) return undefined;
  return v as Array<Record<string, string | undefined>>;
}

/**
 * Walk the alias chain starting from an immediate sub-value alias target.
 * `aliasTarget` is the path the sub-value directly references; the target
 * token's own `aliasChain` continues the walk to the primitive.
 */
function subValueChain(
  aliasTarget: string | undefined,
  resolved: Record<string, DetailToken> | undefined,
): readonly string[] | undefined {
  if (!aliasTarget) return undefined;
  const tok = resolved?.[aliasTarget];
  const tail = tok?.aliasChain;
  return tail && tail.length > 0 ? [aliasTarget, ...tail] : [aliasTarget];
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
