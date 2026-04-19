import type { CSSProperties, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import { BORDER_DEFAULT, MONO_STACK, surfaceStyle } from '#/internal/styles.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';
import {
  MotionSample,
  type MotionSpeed,
  resolveMotionSpec,
} from '#/motion-preview/MotionSample.tsx';

export type { MotionSpeed };

export interface MotionPreviewProps {
  /**
   * Token-path filter. Defaults to transition + duration + cubicBezier
   * tokens. Use e.g. `"motion.sys.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
}

const SPEEDS: MotionSpeed[] = [0.25, 0.5, 1, 2];

const styles = {
  wrapper: surfaceStyle,
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
    fontFamily: MONO_STACK,
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
    borderBottom: BORDER_DEFAULT,
  } satisfies CSSProperties,
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  } satisfies CSSProperties,
  path: {
    fontFamily: MONO_STACK,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  specs: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  empty: {
    padding: '24px 12px',
    textAlign: 'center',
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
};

interface Row {
  path: string;
  cssVar: string;
  durationMs: number;
  easing: string;
  kind: 'transition' | 'duration' | 'cubicBezier';
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
      const kind = token.$type as Row['kind'] | undefined;
      if (!kind) continue;
      const spec = resolveMotionSpec(token, resolved);
      if (!spec) continue;
      collected.push({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        durationMs: spec.durationMs,
        easing: spec.easing,
        kind,
      });
    }
    collected.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
      return a.path.localeCompare(b.path, undefined, { numeric: true });
    });
    return collected;
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} motion token${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)} style={styles.wrapper}>
        <div style={styles.empty}>No motion tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)} style={styles.wrapper}>
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
          <MotionSample path={row.path} speed={speed} runKey={run} />
          <span style={styles.cssVar}>{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
