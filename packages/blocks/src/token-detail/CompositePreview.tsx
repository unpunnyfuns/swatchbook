import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';

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
    return <TransitionSample transition={cssVar} />;
  }
  if (type === 'dimension') {
    return (
      <div className="sb-token-detail__dimension-track">
        <div className="sb-token-detail__dimension-bar" style={{ width: cssVar }} aria-hidden />
      </div>
    );
  }
  if (type === 'duration') {
    return <TransitionSample transition={`left ${cssVar} ease`} />;
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
        style={{ fontWeight: cssVar as unknown as number }}
      >
        Aa
      </div>
    );
  }
  if (type === 'cubicBezier') {
    return <TransitionSample transition={`left 800ms ${cssVar}`} />;
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

function TransitionSample({ transition }: { transition: string }): ReactElement {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<0 | 1>(0);

  useEffect(() => {
    if (reduced) return;
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
      <div className="sb-token-detail__reduced-motion">
        Animation suppressed by `prefers-reduced-motion: reduce`.
      </div>
    );
  }

  return (
    <div className="sb-token-detail__motion-track">
      <div
        className="sb-token-detail__motion-ball"
        style={{
          left: phase === 1 ? 'calc(100% - 28px)' : '4px',
          transition,
        }}
        aria-hidden
      />
    </div>
  );
}
