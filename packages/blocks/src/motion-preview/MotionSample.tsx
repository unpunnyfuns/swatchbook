import type { ReactElement } from 'react';
import './MotionSample.css';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import type { PresenterProps } from '#/presenters/types.ts';

export type MotionSpeed = 0.25 | 0.5 | 1 | 2;

/**
 * Props for the connected {@link MotionSample} block. `token` accepts any
 * of the three motion `$type`s (`transition`, `duration`, `cubicBezier`) —
 * looser than a single-type `PresenterProps<'transition'>` because
 * `resolveMotionSpec` dispatches on the realised `$type` at runtime and
 * TokenNavigator/MotionPreview feed it all three from one call site.
 * `options.speed` is the playback speed multiplier (defaults to `1`);
 * `options.runKey` forces the animation to restart when changed, e.g. from
 * an outer block's "replay" button re-triggering every sample at once.
 */
export type MotionSampleProps = PresenterProps;

const DEFAULT_DURATION_MS = 300;
const DEFAULT_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

export interface Spec {
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

/**
 * Extracts a duration/easing `Spec` from a token's `$value`, dispatching on
 * `$type` (`transition` / `duration` / `cubicBezier`). `themeTokens` backs
 * `{path}`-form sub-value alias resolution for callers still walking a raw
 * (not-yet-realised) project map; pass `{}` when `token` is already a
 * realised leaf (no alias strings survive resolution).
 */
export function resolveMotionSpec(
  token: { $type?: string | undefined; $value?: unknown } | undefined,
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

export interface MotionSampleViewProps {
  spec: Spec | null;
  speed: MotionSpeed;
  runKey: number;
}

/** Pure presentation + animation for a single motion token's sample. Renders from plain props. */
export function MotionSampleView({ spec, speed, runKey }: MotionSampleViewProps): ReactElement {
  const reducedMotion = usePrefersReducedMotion();

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
      <div className="sb-motion-sample__reduced-motion">
        Animation suppressed by <code>prefers-reduced-motion: reduce</code>.
      </div>
    );
  }

  return (
    <div className="sb-motion-sample__track">
      <div
        className={clsx(
          'sb-motion-sample__ball',
          phase === 1 ? 'sb-motion-sample__ball--end' : 'sb-motion-sample__ball--start',
        )}
        style={{ transition: `left ${scaledDuration}ms ${easing}` }}
        aria-hidden
      />
    </div>
  );
}

/**
 * Connected block: renders a realised motion token's animated sample. Both
 * `durationMs` and `easing` come from the realised `$value`; the ball's
 * setInterval loop needs a JS-readable duration, and (see the comment below)
 * `cssVar` cannot stand in for `easing` here. `cssVar` is still accepted, per
 * the uniform `PresenterProps` contract every presenter shares, but this
 * View has nowhere safe to apply it.
 */
export function MotionSample({ token, cssVar: _cssVar, options }: MotionSampleProps): ReactElement {
  const speed = (options?.['speed'] as MotionSpeed | undefined) ?? 1;
  const runKey = (options?.['runKey'] as number | undefined) ?? 0;
  // The token's transition CSS var is a full duration+delay+easing
  // shorthand (e.g. `--sb-transition-enter: 200ms 0ms ease-out`), not an
  // easing-only value. Substituting it into this sample's
  // `left ${scaledDuration}ms ${easing}` template would leave two <time>
  // components in the shorthand, which is invalid at computed-value time:
  // the declaration falls back to `transition: none` and the ball stops
  // animating. Render both duration and easing from the realised value
  // instead; there is no sub-var this View can consume.
  const spec = resolveMotionSpec(token, {});
  return <MotionSampleView spec={spec} speed={speed} runKey={runKey} />;
}
