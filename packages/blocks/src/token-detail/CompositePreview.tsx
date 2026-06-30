import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { cssVarAsNumber } from '#/internal/css-var-style.ts';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';
import { transitionDurationMs } from '#/token-detail/transition-duration.ts';

export interface CompositePreviewProps {
  /** Full dot-path of the token to preview. */
  path: string;
}

const PANGRAM = 'Sphinx of black quartz, judge my vow.';

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

export function CompositePreview({ path }: CompositePreviewProps): ReactElement | null {
  const { token, cssVar } = useTokenDetailData(path);
  if (!token) return null;
  return <CompositePreviewContent type={token.$type} cssVar={cssVar} rawValue={token.$value} />;
}

export function CompositePreviewContent({
  type,
  cssVar,
  rawValue,
}: {
  type: string | undefined;
  cssVar: string;
  rawValue: unknown;
}): ReactElement | null {
  if (type === 'typography') {
    const base = cssVar.replace(/^var\(/, '').replace(/\)$/, '');
    return (
      <div
        className="sb-token-detail__typography-sample"
        style={{
          fontFamily: `var(${base}-font-family)`,
          fontSize: `var(${base}-font-size)`,
          fontWeight: cssVarAsNumber(`var(${base}-font-weight)`),
          lineHeight: cssVarAsNumber(`var(${base}-line-height)`),
          letterSpacing: `var(${base}-letter-spacing)`,
        }}
      >
        {PANGRAM}
      </div>
    );
  }
  if (type === 'shadow') {
    return (
      <div className="sb-token-detail__shadow-sample" style={{ boxShadow: cssVar }} aria-hidden />
    );
  }
  if (type === 'border') {
    return (
      <div className="sb-token-detail__border-sample" style={{ border: cssVar }} aria-hidden />
    );
  }
  if (type === 'transition') {
    return (
      <TransitionSample transition={cssVar} durationMs={transitionDurationMs(type, rawValue)} />
    );
  }
  if (type === 'dimension') {
    return (
      <div className="sb-token-detail__dimension-track">
        <div className="sb-token-detail__dimension-bar" style={{ width: cssVar }} aria-hidden />
      </div>
    );
  }
  if (type === 'duration') {
    return (
      <TransitionSample
        transition={`left ${cssVar} ease`}
        durationMs={transitionDurationMs(type, rawValue)}
      />
    );
  }
  if (type === 'fontFamily') {
    return (
      <div className="sb-token-detail__font-family-sample" style={{ fontFamily: cssVar }}>
        {PANGRAM}
      </div>
    );
  }
  if (type === 'fontWeight') {
    return (
      <div
        className="sb-token-detail__font-weight-sample"
        style={{ fontWeight: cssVarAsNumber(cssVar) }}
      >
        Aa
      </div>
    );
  }
  if (type === 'cubicBezier') {
    return (
      <TransitionSample
        transition={`left 800ms ${cssVar}`}
        durationMs={transitionDurationMs(type, rawValue)}
      />
    );
  }
  if (type === 'gradient') {
    return (
      <div
        className="sb-token-detail__gradient-sample"
        style={{ background: `linear-gradient(to right, ${cssVar})` }}
        aria-hidden
      />
    );
  }
  if (type === 'strokeStyle') {
    return <StrokeStylePreview value={rawValue} />;
  }
  if (type === 'color') {
    return (
      <div className="sb-token-detail__color-swatch-row" aria-hidden>
        <div className="sb-token-detail__color-swatch-light" style={{ background: cssVar }} />
        <div className="sb-token-detail__color-swatch-dark" style={{ background: cssVar }} />
      </div>
    );
  }
  return null;
}

function StrokeStylePreview({ value }: { value: unknown }): ReactElement {
  if (typeof value === 'string' && STROKE_STYLE_STRINGS.has(value)) {
    return (
      <div
        className="sb-token-detail__stroke-style-line"
        style={{ borderTopStyle: value as CSSProperties['borderTopStyle'] }}
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
        <div className="sb-token-detail__stroke-style-fallback">
          Object-form strokeStyle with no resolvable dashArray.
        </div>
      );
    }
    const cap = typeof v.lineCap === 'string' ? v.lineCap : 'butt';
    return (
      <svg
        className="sb-token-detail__stroke-style-svg"
        viewBox="0 0 220 24"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1="4"
          y1="12"
          x2="216"
          y2="12"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={lengths.join(' ')}
          strokeLinecap={cap as 'butt' | 'round' | 'square'}
        />
      </svg>
    );
  }
  return (
    <div className="sb-token-detail__stroke-style-fallback">
      strokeStyle value could not be previewed.
    </div>
  );
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

// Toggle cadence when the token carries no readable duration.
const DEFAULT_LOOP_MS = 1200;
// Rest at each end so the eye registers the position before the ball returns;
// added on top of the move duration so each leg fully completes first.
const MOTION_HOLD_MS = 400;

function TransitionSample({
  transition,
  durationMs,
}: {
  transition: string;
  durationMs?: number | undefined;
}): ReactElement {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<0 | 1>(0);

  useEffect(() => {
    if (reduced) return;
    // Match the loop to the token's real duration; a long token otherwise
    // reversed mid-move under the old fixed 1200ms interval.
    const loopMs = durationMs === undefined ? DEFAULT_LOOP_MS : durationMs + MOTION_HOLD_MS;
    const id = requestAnimationFrame(() => setPhase(1));
    const loop = window.setInterval(() => {
      setPhase((p) => (p === 0 ? 1 : 0));
    }, loopMs);
    return () => {
      cancelAnimationFrame(id);
      window.clearInterval(loop);
    };
  }, [reduced, durationMs]);

  if (reduced) {
    return (
      <div className="sb-token-detail__reduced-motion">
        Animation suppressed by `prefers-reduced-motion: reduce`.
      </div>
    );
  }

  return (
    <div className="sb-token-detail__motion-track">
      <div
        className={clsx(
          'sb-token-detail__motion-ball',
          phase === 1 ? 'sb-token-detail__motion-ball--end' : 'sb-token-detail__motion-ball--start',
        )}
        style={{ transition }}
        aria-hidden
      />
    </div>
  );
}
