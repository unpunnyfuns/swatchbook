import cx from 'clsx';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import './MotionPreview.css';
import { themeAttrs } from '#/internal/data-attr.ts';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import { globMatch, resolveCssVar, useProject } from '#/internal/use-project.ts';
import {
  MotionSample,
  type MotionSpeed,
  resolveMotionSpec,
} from '#/motion-preview/MotionSample.tsx';

export type { MotionSpeed };

export interface MotionPreviewProps {
  /**
   * Token-path filter. Defaults to transition + duration + cubicBezier
   * tokens. Use e.g. `"transition.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
}

const SPEEDS: MotionSpeed[] = [0.25, 0.5, 1, 2];

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
  const project = useProject();
  const { resolved, activePermutation, cssVarPrefix } = project;
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
        cssVar: resolveCssVar(path, project),
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
  }, [resolved, filter, project]);

  const captionText =
    caption ??
    `${rows.length} motion token${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activePermutation}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activePermutation)}>
        <div className="sb-block__empty">No motion tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activePermutation)}>
      <div className="sb-block__caption">{captionText}</div>
      <div className="sb-motion-preview__controls">
        <span className="sb-motion-preview__control-label">Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={cx('sb-motion-preview__speed-btn', {
              'sb-motion-preview__speed-btn--active': s === speed,
            })}
            onClick={() => setSpeed(s)}
          >
            {s}×
          </button>
        ))}
        <button
          type="button"
          className="sb-motion-preview__replay-btn"
          onClick={() => setRun((n) => n + 1)}
          disabled={reducedMotion}
          title={reducedMotion ? 'Disabled by prefers-reduced-motion' : 'Replay all'}
        >
          ↻ Replay
        </button>
      </div>
      {rows.map((row) => (
        <div key={row.path} className="sb-motion-preview__row">
          <div className="sb-motion-preview__meta">
            <span className="sb-motion-preview__path">{row.path}</span>
            <span className="sb-motion-preview__specs">{formatSpec(row)}</span>
          </div>
          <MotionSample path={row.path} speed={speed} runKey={run} />
          <span className="sb-motion-preview__css-var">{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
