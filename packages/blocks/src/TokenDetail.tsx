import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import { formatValue, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface TokenDetailProps {
  /** Full dot-path of the token to inspect. */
  path: string;
  /** Override the heading. Defaults to the path. */
  heading?: string;
}

interface DetailToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
  aliasOf?: string;
  aliasChain?: readonly string[];
  aliasedBy?: readonly string[];
}

const ALIASED_BY_DEPTH_CAP = 6;

interface AliasedByNode {
  path: string;
  children: AliasedByNode[];
  truncated?: boolean;
}

const styles = {
  wrapper: {
    fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
    fontSize: 'var(--sb-typography-sys-body-font-size, 14px)',
    color: 'var(--sb-color-sys-text-default, CanvasText)',
    background: 'var(--sb-color-sys-surface-default, Canvas)',
    padding: 16,
    borderRadius: 6,
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  heading: {
    margin: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 16,
  } satisfies CSSProperties,
  subline: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '4px 0 12px',
    fontSize: 12,
    opacity: 0.8,
  } satisfies CSSProperties,
  typePill: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.15))',
  } satisfies CSSProperties,
  description: {
    margin: '0 0 12px',
    opacity: 0.85,
  } satisfies CSSProperties,
  sectionHeader: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    margin: '12px 0 6px',
  } satisfies CSSProperties,
  chain: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  } satisfies CSSProperties,
  chainNode: {
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  arrow: {
    opacity: 0.5,
  } satisfies CSSProperties,
  themeTable: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    fontSize: 12,
  } satisfies CSSProperties,
  themeRow: {
    borderBottom: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))',
  } satisfies CSSProperties,
  themeCell: {
    padding: '6px 8px',
    verticalAlign: 'middle',
  } satisfies CSSProperties,
  swatch: {
    display: 'inline-block',
    width: 14,
    height: 14,
    verticalAlign: 'middle',
    marginRight: 6,
    borderRadius: 3,
    border: '1px solid var(--sb-color-sys-border-default, rgba(0,0,0,0.1))',
  } satisfies CSSProperties,
  snippet: {
    display: 'block',
    padding: '8px 10px',
    borderRadius: 4,
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.1))',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    whiteSpace: 'pre',
    overflow: 'auto',
  } satisfies CSSProperties,
  missing: {
    padding: 12,
    opacity: 0.7,
  } satisfies CSSProperties,
  typographySample: {
    padding: '8px 0',
  } satisfies CSSProperties,
  shadowSample: {
    width: 140,
    height: 56,
    background: 'var(--sb-color-sys-surface-raised, #fff)',
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))',
    borderRadius: 6,
  } satisfies CSSProperties,
  borderSample: {
    width: 140,
    height: 56,
    background: 'var(--sb-color-sys-surface-raised, transparent)',
    borderRadius: 6,
  } satisfies CSSProperties,
  gradientSample: {
    width: 220,
    height: 56,
    borderRadius: 6,
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))',
  } satisfies CSSProperties,
  strokeStyleLine: {
    height: 0,
    borderTopWidth: 4,
    borderTopColor: 'var(--sb-color-sys-text-default, CanvasText)',
    width: 220,
  } satisfies CSSProperties,
  strokeStyleSvg: {
    width: 220,
    height: 24,
    color: 'var(--sb-color-sys-text-default, CanvasText)',
  } satisfies CSSProperties,
  strokeStyleFallback: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  colorSwatchRow: {
    display: 'flex',
    gap: 1,
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
    width: 220,
    height: 56,
  } satisfies CSSProperties,
  colorSwatchLight: {
    flex: 1,
    boxShadow: 'inset 0 0 0 8px rgba(255, 255, 255, 0.9)',
  } satisfies CSSProperties,
  colorSwatchDark: {
    flex: 1,
    boxShadow: 'inset 0 0 0 8px rgba(17, 17, 17, 0.9)',
  } satisfies CSSProperties,
  breakdownSection: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 12,
    rowGap: 3,
    marginTop: 6,
  } satisfies CSSProperties,
  breakdownKey: {
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  breakdownLayerHeader: {
    gridColumn: '1 / -1',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    marginTop: 4,
  } satisfies CSSProperties,
  fontFamilySample: {
    padding: '4px 0',
    fontSize: 22,
    lineHeight: 1.2,
  } satisfies CSSProperties,
  fontWeightSample: {
    padding: '4px 0',
    fontSize: 32,
    lineHeight: 1,
  } satisfies CSSProperties,
  dimensionTrack: {
    display: 'flex',
    alignItems: 'center',
    height: 32,
    maxWidth: '100%',
    overflow: 'hidden',
  } satisfies CSSProperties,
  dimensionBar: {
    height: 16,
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
    borderRadius: 3,
    maxWidth: '100%',
  } satisfies CSSProperties,
  motionTrack: {
    position: 'relative',
    height: 32,
    width: '100%',
    maxWidth: 320,
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.08))',
    borderRadius: 16,
    overflow: 'hidden',
  } satisfies CSSProperties,
  motionBall: {
    position: 'absolute',
    top: '50%',
    width: 24,
    height: 24,
    marginTop: -12,
    borderRadius: '50%',
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
  } satisfies CSSProperties,
  aliasedByList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  } satisfies CSSProperties,
  aliasedByRow: {
    padding: '2px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } satisfies CSSProperties,
  aliasedByTruncated: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 4,
  } satisfies CSSProperties,
  reducedMotion: {
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    fontStyle: 'italic',
  } satisfies CSSProperties,
};

export function TokenDetail({ path, heading }: TokenDetailProps): ReactElement {
  const { activeTheme, activeAxes, axes, themes, themesResolved, resolved, cssVarPrefix } =
    useProject();

  const token = resolved[path] as DetailToken | undefined;
  const cssVar = makeCssVar(path, cssVarPrefix);

  const aliasedByTree = useMemo<AliasedByNode[]>(
    () => buildAliasedByTree(path, resolved),
    [path, resolved],
  );
  const aliasedByTruncated = useMemo(() => treeHasTruncation(aliasedByTree), [aliasedByTree]);

  const chain = useMemo<string[]>(() => {
    if (!token) return [];
    if (Array.isArray(token.aliasChain) && token.aliasChain.length > 0) {
      return [path, ...token.aliasChain];
    }
    if (typeof token.aliasOf === 'string') return [path, token.aliasOf];
    return [path];
  }, [token, path]);

  if (!token) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.missing}>
          Token <code>{path}</code> not found in theme <strong>{activeTheme}</strong>.
        </div>
      </div>
    );
  }

  const isColor = token.$type === 'color';
  const value = formatValue(token.$value);

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <h3 style={styles.heading}>{heading ?? path}</h3>
      <div style={styles.subline}>
        {token.$type && <span style={styles.typePill}>{token.$type}</span>}
        <span>{cssVar}</span>
      </div>
      {token.$description && <p style={styles.description}>{token.$description}</p>}

      <div style={styles.sectionHeader}>Resolved value · {activeTheme}</div>
      <CompositePreview type={token.$type} cssVar={cssVar} rawValue={token.$value} />
      <CompositeBreakdown type={token.$type} rawValue={token.$value} />
      <div style={styles.chain}>
        {isColor && <span style={{ ...styles.swatch, background: cssVar }} aria-hidden />}
        <span>{value}</span>
      </div>

      {chain.length > 1 && (
        <>
          <div style={styles.sectionHeader}>Alias chain</div>
          <div style={styles.chain}>
            {chain.map((step, i) => (
              <span key={step} style={styles.chain}>
                <span style={styles.chainNode}>{step}</span>
                {i < chain.length - 1 && <span style={styles.arrow}>→</span>}
              </span>
            ))}
          </div>
        </>
      )}

      {aliasedByTree.length > 0 && (
        <>
          <div style={styles.sectionHeader}>Aliased by</div>
          <ul style={styles.aliasedByList}>
            {aliasedByTree.map((node) => (
              <AliasedByRow key={node.path} node={node} depth={0} />
            ))}
          </ul>
          {aliasedByTruncated && (
            <div style={styles.aliasedByTruncated}>
              Further descendants truncated at depth {ALIASED_BY_DEPTH_CAP}.
            </div>
          )}
        </>
      )}

      <AxisVariance
        path={path}
        isColor={isColor}
        cssVar={cssVar}
        axes={axes}
        themes={themes}
        themesResolved={themesResolved}
        activeAxes={activeAxes}
      />

      <div style={styles.sectionHeader}>Usage</div>
      <code style={styles.snippet}>{`color: ${cssVar};`}</code>
    </div>
  );
}

const PANGRAM = 'Sphinx of black quartz, judge my vow.';

function CompositePreview({
  type,
  cssVar,
  rawValue,
}: {
  type: string | undefined;
  cssVar: string;
  rawValue: unknown;
}): ReactElement | null {
  if (type === 'typography') {
    // cssVar for a composite looks like `var(--…-<path>)`; the emitter also
    // emits sub-vars named `--…-<path>-font-family`, `-font-size`, etc.
    // Peel the `var(--…)` wrapping to reuse the base name.
    const base = cssVar.replace(/^var\(/, '').replace(/\)$/, '');
    return (
      <div
        style={{
          ...styles.typographySample,
          fontFamily: `var(${base}-font-family)`,
          fontSize: `var(${base}-font-size)`,
          fontWeight: `var(${base}-font-weight)` as unknown as number,
          lineHeight: `var(${base}-line-height)` as unknown as number,
          letterSpacing: `var(${base}-letter-spacing)`,
        }}
      >
        {PANGRAM}
      </div>
    );
  }
  if (type === 'shadow') {
    return <div style={{ ...styles.shadowSample, boxShadow: cssVar }} aria-hidden />;
  }
  if (type === 'border') {
    return <div style={{ ...styles.borderSample, border: cssVar }} aria-hidden />;
  }
  if (type === 'transition') {
    return <TransitionSample transition={cssVar} />;
  }
  if (type === 'dimension') {
    return (
      <div style={styles.dimensionTrack}>
        <div style={{ ...styles.dimensionBar, width: cssVar }} aria-hidden />
      </div>
    );
  }
  if (type === 'duration') {
    // Synthesize a transition with a neutral easing so the duration is
    // perceptible on its own.
    return <TransitionSample transition={`left ${cssVar} ease`} />;
  }
  if (type === 'fontFamily') {
    return <div style={{ ...styles.fontFamilySample, fontFamily: cssVar }}>{PANGRAM}</div>;
  }
  if (type === 'fontWeight') {
    return (
      <div
        style={{
          ...styles.fontWeightSample,
          fontWeight: cssVar as unknown as number,
        }}
      >
        Aa
      </div>
    );
  }
  if (type === 'cubicBezier') {
    // Synthesize a transition at a fixed duration so the easing curve is
    // perceptible on its own.
    return <TransitionSample transition={`left 800ms ${cssVar}`} />;
  }
  if (type === 'gradient') {
    // Terrazzo emits gradient tokens as a raw stop list (e.g.
    // `rgb(…) 0%, rgb(…) 100%`) without wrapping them in a gradient
    // function — consumers pick linear/radial/conic at use-site. Default
    // to linear-gradient for a preview.
    return (
      <div
        style={{ ...styles.gradientSample, background: `linear-gradient(to right, ${cssVar})` }}
        aria-hidden
      />
    );
  }
  if (type === 'strokeStyle') {
    return <StrokeStylePreview value={rawValue} />;
  }
  if (type === 'color') {
    // Two stacked swatches on light + dark surfaces so out-of-gamut or
    // low-contrast colors become visible against either background.
    return (
      <div style={styles.colorSwatchRow} aria-hidden>
        <div style={{ ...styles.colorSwatchLight, background: cssVar }} />
        <div style={{ ...styles.colorSwatchDark, background: cssVar }} />
      </div>
    );
  }
  return null;
}

function CompositeBreakdown({
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

const STROKE_STYLE_STRINGS = new Set([
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'outset',
  'inset',
]);

function StrokeStylePreview({ value }: { value: unknown }): ReactElement {
  if (typeof value === 'string' && STROKE_STYLE_STRINGS.has(value)) {
    return (
      <div
        style={{
          ...styles.strokeStyleLine,
          borderTopStyle: value as CSSProperties['borderTopStyle'],
        }}
        aria-hidden
      />
    );
  }
  if (value && typeof value === 'object' && 'dashArray' in value) {
    const v = value as {
      dashArray?: unknown;
      lineCap?: unknown;
    };
    const lengths = asDashLengths(v.dashArray);
    if (lengths.length === 0) {
      return (
        <div style={styles.strokeStyleFallback}>
          Object-form strokeStyle with no resolvable dashArray.
        </div>
      );
    }
    const cap = typeof v.lineCap === 'string' ? v.lineCap : 'butt';
    return (
      <svg
        style={styles.strokeStyleSvg}
        viewBox='0 0 220 24'
        preserveAspectRatio='none'
        aria-hidden
      >
        <line
          x1='4'
          y1='12'
          x2='216'
          y2='12'
          stroke='currentColor'
          strokeWidth='4'
          strokeDasharray={lengths.join(' ')}
          strokeLinecap={cap as 'butt' | 'round' | 'square'}
        />
      </svg>
    );
  }
  return <div style={styles.strokeStyleFallback}>strokeStyle value could not be previewed.</div>;
}

function asDashLengths(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const entry of raw) {
    if (typeof entry === 'number') {
      out.push(entry);
      continue;
    }
    if (entry && typeof entry === 'object') {
      const e = entry as { value?: unknown };
      if (typeof e.value === 'number') out.push(e.value);
    }
  }
  return out;
}

function TransitionSample({ transition }: { transition: string }): ReactElement {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<0 | 1>(0);

  useEffect(() => {
    if (reduced) return;
    // Loop between 0 and 1 at a fixed cadence a bit slower than the token's
    // own duration so the easing curve is perceptible.
    const id = requestAnimationFrame(() => setPhase(1));
    const loop = window.setInterval(() => {
      setPhase((p) => (p === 0 ? 1 : 0));
    }, 1200);
    return () => {
      cancelAnimationFrame(id);
      window.clearInterval(loop);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div style={styles.reducedMotion}>
        Animation suppressed by `prefers-reduced-motion: reduce`.
      </div>
    );
  }

  return (
    <div style={styles.motionTrack}>
      <div
        style={{
          ...styles.motionBall,
          left: phase === 1 ? 'calc(100% - 28px)' : '4px',
          transition,
        }}
        aria-hidden
      />
    </div>
  );
}

interface VirtualAxisLike {
  readonly name: string;
  readonly contexts: readonly string[];
  readonly default: string;
  readonly source: 'resolver' | 'synthetic';
}

interface VirtualThemeLike {
  readonly name: string;
  readonly input: Record<string, string>;
}

function themeValue(
  themesResolved: Record<string, Record<string, DetailToken>>,
  themeName: string,
  path: string,
): string {
  const t = themesResolved[themeName]?.[path];
  return t ? formatValue(t.$value) : '—';
}

function tupleName(
  themes: readonly VirtualThemeLike[],
  tuple: Record<string, string>,
): string | undefined {
  const match = themes.find((t) => {
    const input = t.input;
    const keys = Object.keys(input);
    return keys.every((k) => input[k] === tuple[k]);
  });
  return match?.name;
}

/**
 * Analyze how a token's value moves across axes. Returns:
 *   - 'constant' — same value under every tuple
 *   - 'one-axis' — exactly one axis influences the value (the token is
 *     insensitive to every other axis)
 *   - 'multi-axis' — two or more axes influence the value
 */
interface Variance {
  kind: 'constant' | 'one-axis' | 'multi-axis';
  varyingAxes: readonly string[];
}

function analyzeVariance(
  path: string,
  axes: readonly VirtualAxisLike[],
  themes: readonly VirtualThemeLike[],
  themesResolved: Record<string, Record<string, DetailToken>>,
): Variance {
  const varyingAxes: string[] = [];
  for (const axis of axes) {
    // Group themes by all other axes' context values, and see whether the
    // token's value moves when only this axis changes within each group.
    const byOthers = new Map<string, Map<string, string>>();
    for (const theme of themes) {
      const others = axes
        .filter((a) => a.name !== axis.name)
        .map((a) => `${a.name}=${theme.input[a.name] ?? ''}`)
        .join('|');
      const ctx = theme.input[axis.name] ?? '';
      const bucket = byOthers.get(others) ?? new Map<string, string>();
      bucket.set(ctx, themeValue(themesResolved, theme.name, path));
      byOthers.set(others, bucket);
    }
    let varies = false;
    for (const bucket of byOthers.values()) {
      const values = new Set(bucket.values());
      if (values.size > 1) {
        varies = true;
        break;
      }
    }
    if (varies) varyingAxes.push(axis.name);
  }
  if (varyingAxes.length === 0) return { kind: 'constant', varyingAxes };
  if (varyingAxes.length === 1) return { kind: 'one-axis', varyingAxes };
  return { kind: 'multi-axis', varyingAxes };
}

interface AxisVarianceProps {
  path: string;
  isColor: boolean;
  cssVar: string;
  axes: readonly VirtualAxisLike[];
  themes: readonly VirtualThemeLike[];
  themesResolved: Record<string, Record<string, DetailToken>>;
  activeAxes: Record<string, string>;
}

function AxisVariance({
  path,
  isColor,
  cssVar,
  axes,
  themes,
  themesResolved,
  activeAxes,
}: AxisVarianceProps): ReactElement {
  const variance = useMemo(
    () => analyzeVariance(path, axes, themes, themesResolved),
    [path, axes, themes, themesResolved],
  );

  if (themes.length === 0) {
    return <></>;
  }

  if (variance.kind === 'constant') {
    const anyTheme = themes[0];
    const value = anyTheme ? themeValue(themesResolved, anyTheme.name, path) : '—';
    return (
      <>
        <div style={styles.sectionHeader}>Values across axes</div>
        <table style={styles.themeTable} data-testid='token-detail-values'>
          <tbody>
            <tr style={styles.themeRow}>
              <td style={styles.themeCell} data-testid='token-detail-constant'>
                {isColor && <span style={{ ...styles.swatch, background: cssVar }} aria-hidden />}
                {value}
                <span style={{ opacity: 0.6, marginLeft: 8 }}>
                  same across all {themes.length} tuples
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  if (variance.kind === 'one-axis') {
    const axisName = variance.varyingAxes[0];
    if (!axisName) return <></>;
    const axis = axes.find((a) => a.name === axisName);
    if (!axis) return <></>;
    // Pick one representative theme per context of the varying axis — the
    // one whose other-axis contexts match the active tuple, so the displayed
    // values line up with the rest of the doc block.
    const contextValues = axis.contexts.map((ctx) => {
      const target = { ...activeAxes, [axisName]: ctx };
      const match = themes.find((t) => {
        const input = t.input;
        return Object.keys(input).every((k) => input[k] === target[k]);
      });
      const name = match?.name ?? '';
      return {
        ctx,
        themeName: name,
        value: name ? themeValue(themesResolved, name, path) : '—',
      };
    });
    return (
      <>
        <div style={styles.sectionHeader}>Varies with {axisName}</div>
        <table style={styles.themeTable} data-testid='token-detail-values'>
          <tbody>
            {contextValues.map((row) => (
              <tr key={row.ctx} style={styles.themeRow} data-axis={axisName} data-context={row.ctx}>
                <td style={{ ...styles.themeCell, width: '30%' }}>{row.ctx}</td>
                <td style={styles.themeCell}>
                  {isColor && row.themeName && (
                    <span
                      style={{ ...styles.swatch, background: cssVar }}
                      data-theme={row.themeName}
                      aria-hidden
                    />
                  )}
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  // Multi-axis: render a matrix for the two most-varying axes (by context
  // count), collapsing further axes to the active tuple and noting their
  // influence.
  const varying = variance.varyingAxes
    .map((name) => axes.find((a) => a.name === name))
    .filter((a): a is VirtualAxisLike => Boolean(a))
    .toSorted((a, b) => b.contexts.length - a.contexts.length);
  const [rowAxis, colAxis, ...extra] = varying;
  if (!rowAxis || !colAxis) return <></>;

  return (
    <>
      <div style={styles.sectionHeader}>Varies with {variance.varyingAxes.join(' × ')}</div>
      <table style={styles.themeTable} data-testid='token-detail-values'>
        <thead>
          <tr style={styles.themeRow}>
            <th style={{ ...styles.themeCell, textAlign: 'left', opacity: 0.7 }}>
              {rowAxis.name} \ {colAxis.name}
            </th>
            {colAxis.contexts.map((col) => (
              <th key={col} style={{ ...styles.themeCell, textAlign: 'left', opacity: 0.7 }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowAxis.contexts.map((row) => (
            <tr key={row} style={styles.themeRow}>
              <td style={styles.themeCell}>{row}</td>
              {colAxis.contexts.map((col) => {
                const target: Record<string, string> = {
                  ...activeAxes,
                  [rowAxis.name]: row,
                  [colAxis.name]: col,
                };
                const name = tupleName(themes, target);
                const value = name ? themeValue(themesResolved, name, path) : '—';
                return (
                  <td key={col} style={styles.themeCell} data-row={row} data-col={col}>
                    {isColor && name && (
                      <span
                        style={{ ...styles.swatch, background: cssVar }}
                        data-theme={name}
                        aria-hidden
                      />
                    )}
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {extra.length > 0 && (
        <div style={{ ...styles.aliasedByTruncated, marginTop: 6 }}>
          Values also vary with {extra.map((a) => a.name).join(', ')}; matrix shows the slice for
          the active selection.
        </div>
      )}
    </>
  );
}

function buildAliasedByTree(rootPath: string, resolved: Record<string, unknown>): AliasedByNode[] {
  const root = resolved[rootPath] as DetailToken | undefined;
  const direct = root?.aliasedBy;
  if (!direct || direct.length === 0) return [];

  const visited = new Set<string>([rootPath]);
  return sortPaths(direct).map((p) => walk(p, resolved, visited, 1));
}

function walk(
  path: string,
  resolved: Record<string, unknown>,
  visited: Set<string>,
  depth: number,
): AliasedByNode {
  if (visited.has(path)) return { path, children: [] };
  visited.add(path);
  const token = resolved[path] as DetailToken | undefined;
  const parents = token?.aliasedBy;
  if (!parents || parents.length === 0) return { path, children: [] };
  if (depth >= ALIASED_BY_DEPTH_CAP) {
    return { path, children: [], truncated: true };
  }
  const children = sortPaths(parents).map((p) => walk(p, resolved, visited, depth + 1));
  return { path, children };
}

const GROUP_RANK: Record<string, number> = { ref: 0, sys: 1 };

function sortPaths(paths: readonly string[]): string[] {
  return paths.toSorted((a, b) => {
    const ra = GROUP_RANK[a.split('.')[0] ?? ''] ?? 2;
    const rb = GROUP_RANK[b.split('.')[0] ?? ''] ?? 2;
    return ra !== rb ? ra - rb : a.localeCompare(b);
  });
}

function treeHasTruncation(nodes: AliasedByNode[]): boolean {
  for (const n of nodes) {
    if (n.truncated) return true;
    if (treeHasTruncation(n.children)) return true;
  }
  return false;
}

function AliasedByRow({ node, depth }: { node: AliasedByNode; depth: number }): ReactElement {
  return (
    <li>
      <div style={{ ...styles.aliasedByRow, paddingLeft: depth * 16 }}>
        <span style={styles.chainNode}>{node.path}</span>
      </div>
      {node.children.length > 0 && (
        <ul style={styles.aliasedByList}>
          {node.children.map((child) => (
            <AliasedByRow key={child.path} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
