import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export type MotionSpeed = 0.25 | 0.5 | 1 | 2;

export interface MotionPreviewProps {
  /**
   * Token-path filter. Defaults to transition + duration + cubicBezier
   * tokens. Use e.g. `"motion.sys.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
}

const DEFAULT_DURATION_MS = 300;
const DEFAULT_EASING = 'cubic-bezier(0.2, 0, 0, 1)';
const SPEEDS: MotionSpeed[] = [0.25, 0.5, 1, 2];

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
    padding: '4px 0 4px',
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    fontSize: 12,
  } satisfies CSSProperties,
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0 12px',
  } satisfies CSSProperties,
  controlLabel: {
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } satisfies CSSProperties,
  speedBtn: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    padding: '4px 8px',
    background: 'transparent',
    color: 'inherit',
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.3))',
    borderRadius: 4,
    cursor: 'pointer',
  } satisfies CSSProperties,
  speedBtnActive: {
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
    color: 'var(--sb-color-sys-accent-fg, #fff)',
    borderColor: 'transparent',
  } satisfies CSSProperties,
  replayBtn: {
    fontSize: 11,
    padding: '4px 10px',
    marginLeft: 'auto',
    background: 'transparent',
    color: 'inherit',
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.3))',
    borderRadius: 4,
    cursor: 'pointer',
  } satisfies CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 240px) 1fr auto',
    gap: 16,
    alignItems: 'center',
    padding: '14px 0',
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
  specs: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  track: {
    position: 'relative',
    height: 36,
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.08))',
    borderRadius: 18,
    overflow: 'hidden',
  } satisfies CSSProperties,
  ball: {
    position: 'absolute',
    top: '50%',
    width: 28,
    height: 28,
    marginTop: -14,
    borderRadius: '50%',
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  empty: {
    padding: '24px 12px',
    textAlign: 'center',
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  reducedMotion: {
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    fontStyle: 'italic',
  } satisfies CSSProperties,
};

interface Row {
  path: string;
  cssVar: string;
  durationMs: number;
  easing: string;
  kind: 'transition' | 'duration' | 'cubicBezier';
}

function extractDurationMs(raw: unknown): number {
  if (raw == null) return Number.NaN;
  if (typeof raw === 'object') {
    const v = raw as { value?: unknown; unit?: unknown };
    if (typeof v.value === 'number' && typeof v.unit === 'string') {
      if (v.unit === 'ms') return v.value;
      if (v.unit === 's') return v.value * 1000;
    }
  }
  return Number.NaN;
}

function extractCubicBezier(raw: unknown): string | null {
  if (Array.isArray(raw) && raw.length === 4 && raw.every((n) => typeof n === 'number')) {
    return `cubic-bezier(${raw.map((n) => Number(n).toFixed(3)).join(', ')})`;
  }
  return null;
}

function resolveSpec(
  token: { $type?: string; $value?: unknown },
  themeTokens: Record<string, { $value?: unknown }>,
): Pick<Row, 'durationMs' | 'easing' | 'kind'> | null {
  const type = token.$type;
  if (type === 'transition') {
    const v = (token.$value ?? {}) as {
      duration?: unknown;
      timingFunction?: unknown;
    };
    return {
      kind: 'transition',
      durationMs: asDuration(v.duration, themeTokens, DEFAULT_DURATION_MS),
      easing: asEasing(v.timingFunction, themeTokens, DEFAULT_EASING),
    };
  }
  if (type === 'duration') {
    return {
      kind: 'duration',
      durationMs: extractDurationMs(token.$value),
      easing: DEFAULT_EASING,
    };
  }
  if (type === 'cubicBezier') {
    const easing = extractCubicBezier(token.$value);
    if (!easing) return null;
    return { kind: 'cubicBezier', durationMs: DEFAULT_DURATION_MS, easing };
  }
  return null;
}

function asDuration(
  raw: unknown,
  themeTokens: Record<string, { $value?: unknown }>,
  fallback: number,
): number {
  const direct = extractDurationMs(raw);
  if (Number.isFinite(direct)) return direct;
  if (typeof raw === 'string') {
    // Alias strings like "{duration.ref.normal}" resolve to a reference in themeTokens.
    const match = raw.match(/^\{([^}]+)\}$/);
    if (match && match[1]) {
      const referenced = themeTokens[match[1]];
      const resolved = extractDurationMs(referenced?.$value);
      if (Number.isFinite(resolved)) return resolved;
    }
  }
  return fallback;
}

function asEasing(
  raw: unknown,
  themeTokens: Record<string, { $value?: unknown }>,
  fallback: string,
): string {
  const direct = extractCubicBezier(raw);
  if (direct) return direct;
  if (typeof raw === 'string') {
    const match = raw.match(/^\{([^}]+)\}$/);
    if (match && match[1]) {
      const referenced = themeTokens[match[1]];
      const resolved = extractCubicBezier(referenced?.$value);
      if (resolved) return resolved;
    }
  }
  return fallback;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent): void => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function MotionPreview({ filter, caption }: MotionPreviewProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();
  const [speed, setSpeed] = useState<MotionSpeed>(1);
  const [run, setRun] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const rows = useMemo(() => {
    const collected: Row[] = [];
    for (const [path, token] of Object.entries(resolved)) {
      if (filter && !globMatch(path, filter)) continue;
      if (!filter && !['transition', 'duration', 'cubicBezier'].includes(token.$type ?? '')) {
        continue;
      }
      const spec = resolveSpec(token, resolved);
      if (!spec) continue;
      collected.push({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        ...spec,
      });
    }
    collected.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
      return a.path.localeCompare(b.path);
    });
    return collected;
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} motion token${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.empty}>No motion tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <div style={styles.caption}>{captionText}</div>
      <div style={styles.controls}>
        <span style={styles.controlLabel}>Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type='button'
            style={{ ...styles.speedBtn, ...(s === speed ? styles.speedBtnActive : {}) }}
            onClick={() => setSpeed(s)}
          >
            {s}×
          </button>
        ))}
        <button
          type='button'
          style={styles.replayBtn}
          onClick={() => setRun((n) => n + 1)}
          disabled={reducedMotion}
          title={reducedMotion ? 'Disabled by prefers-reduced-motion' : 'Replay all'}
        >
          ↻ Replay
        </button>
      </div>
      {rows.map((row) => (
        <div key={row.path} style={styles.row}>
          <div style={styles.meta}>
            <span style={styles.path}>{row.path}</span>
            <span style={styles.specs}>{formatSpec(row)}</span>
          </div>
          {reducedMotion ? (
            <div style={styles.reducedMotion}>
              Animation suppressed by `prefers-reduced-motion: reduce`.
            </div>
          ) : (
            <MotionTrack row={row} speed={speed} runKey={run} />
          )}
          <span style={styles.cssVar}>{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}

function formatSpec(row: Row): string {
  switch (row.kind) {
    case 'transition':
      return `transition · ${Math.round(row.durationMs)}ms · ${row.easing}`;
    case 'duration':
      return `duration · ${Math.round(row.durationMs)}ms`;
    case 'cubicBezier':
      return `cubicBezier · ${row.easing}`;
  }
}

function MotionTrack({
  row,
  speed,
  runKey,
}: {
  row: Row;
  speed: MotionSpeed;
  runKey: number;
}): ReactElement {
  const [phase, setPhase] = useState<0 | 1>(0);
  const scaledDuration = Math.max(1, row.durationMs / speed);

  useEffect(() => {
    // Reset to 0 on replay / speed change, then tick to 1 next frame so the
    // transition actually plays (going 0 → 1 each cycle).
    setPhase(0);
    const id = requestAnimationFrame(() => setPhase(1));
    const loop = window.setInterval(() => {
      setPhase((p) => (p === 0 ? 1 : 0));
    }, scaledDuration * 2);
    return () => {
      cancelAnimationFrame(id);
      window.clearInterval(loop);
    };
  }, [scaledDuration, runKey, row.path]);

  return (
    <div style={styles.track}>
      <div
        style={{
          ...styles.ball,
          left: phase === 1 ? 'calc(100% - 32px)' : '4px',
          transition: `left ${scaledDuration}ms ${row.easing}`,
        }}
        aria-hidden
      />
    </div>
  );
}
