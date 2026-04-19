import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { chromeAliases } from '#/internal/data-attr.ts';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import { useProject } from '#/internal/use-project.ts';

export type MotionSpeed = 0.25 | 0.5 | 1 | 2;

export interface MotionSampleProps {
  /** Full dot-path of the motion token (`transition`, `duration`, or `cubicBezier`). */
  path: string;
  /** Playback speed multiplier. Defaults to `1`. */
  speed?: MotionSpeed;
  /**
   * Change this value to force the animation to restart. Useful when an
   * outer block exposes a "replay" button that should re-trigger every
   * sample at once.
   */
  runKey?: number;
}

const DEFAULT_DURATION_MS = 300;
const DEFAULT_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

const styles = {
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
  reducedMotion: {
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    fontStyle: 'italic',
  } satisfies CSSProperties,
};

interface Spec {
  durationMs: number;
  easing: string;
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

function asDuration(
  raw: unknown,
  themeTokens: Record<string, { $value?: unknown }>,
  fallback: number,
): number {
  const direct = extractDurationMs(raw);
  if (Number.isFinite(direct)) return direct;
  if (typeof raw === 'string') {
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

export function resolveMotionSpec(
  token: { $type?: string; $value?: unknown } | undefined,
  themeTokens: Record<string, { $value?: unknown }>,
): Spec | null {
  if (!token) return null;
  const type = token.$type;
  if (type === 'transition') {
    const v = (token.$value ?? {}) as {
      duration?: unknown;
      timingFunction?: unknown;
    };
    return {
      durationMs: asDuration(v.duration, themeTokens, DEFAULT_DURATION_MS),
      easing: asEasing(v.timingFunction, themeTokens, DEFAULT_EASING),
    };
  }
  if (type === 'duration') {
    const durationMs = extractDurationMs(token.$value);
    if (!Number.isFinite(durationMs)) return null;
    return { durationMs, easing: DEFAULT_EASING };
  }
  if (type === 'cubicBezier') {
    const easing = extractCubicBezier(token.$value);
    if (!easing) return null;
    return { durationMs: DEFAULT_DURATION_MS, easing };
  }
  return null;
}

export function MotionSample({ path, speed = 1, runKey = 0 }: MotionSampleProps): ReactElement {
  const { resolved, cssVarPrefix } = useProject();
  const reducedMotion = usePrefersReducedMotion();

  const spec = useMemo(() => resolveMotionSpec(resolved[path], resolved), [resolved, path]);

  const durationMs = spec?.durationMs ?? DEFAULT_DURATION_MS;
  const easing = spec?.easing ?? DEFAULT_EASING;
  const scaledDuration = Math.max(1, durationMs / speed);

  const [phase, setPhase] = useState<0 | 1>(0);

  useEffect(() => {
    if (reducedMotion) return;
    setPhase(0);
    const id = requestAnimationFrame(() => setPhase(1));
    const loop = window.setInterval(() => {
      setPhase((p) => (p === 0 ? 1 : 0));
    }, scaledDuration * 2);
    return () => {
      cancelAnimationFrame(id);
      window.clearInterval(loop);
    };
  }, [scaledDuration, runKey, reducedMotion]);

  if (reducedMotion) {
    return (
      <div style={{ ...chromeAliases(cssVarPrefix), ...styles.reducedMotion }}>
        Animation suppressed by `prefers-reduced-motion: reduce`.
      </div>
    );
  }

  return (
    <div style={{ ...chromeAliases(cssVarPrefix), ...styles.track }}>
      <div
        style={{
          ...styles.ball,
          left: phase === 1 ? 'calc(100% - 32px)' : '4px',
          transition: `left ${scaledDuration}ms ${easing}`,
        }}
        aria-hidden
      />
    </div>
  );
}
