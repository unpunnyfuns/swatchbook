import cx from 'clsx';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import './MotionPreview.css';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import type { RealisedToken } from '#/internal/composite-types.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { resolveMotionSpec } from '#/motion-preview/MotionSample.tsx';
import type { MotionSpeed } from '#/motion-preview/MotionSample.tsx';
import { usePresenter } from '#/presenters/registry.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

export type { MotionSpeed };

/**
 * Unlike the other filter/caption/sortBy/sortDir blocks in this family,
 * `MotionPreview` has no `sortBy`/`sortDir` — rows are always ordered by
 * kind (`transition` / `duration` / `cubicBezier`) then path. There's no
 * single numeric axis across the three kinds that a sort would meaningfully
 * order by.
 */
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

export interface MotionRow {
  path: string;
  cssVar: string;
  /** Realised token, fed to `MotionSample` per the presenter contract. */
  token: RealisedToken;
  durationMs: number;
  easing: string;
  kind: 'transition' | 'duration' | 'cubicBezier';
}

export interface DeriveMotionRowsOptions {
  filter?: string | undefined;
}

function formatSpec(row: MotionRow): string {
  switch (row.kind) {
    case 'transition':
      return `transition · ${Math.round(row.durationMs)}ms · ${row.easing}`;
    case 'duration':
      return `duration · ${Math.round(row.durationMs)}ms`;
    case 'cubicBezier':
      return `cubicBezier · ${row.easing}`;
  }
}

/**
 * Pure derivation of the preview's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveMotionRows(
  resolved: ProjectData['resolved'],
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
  { filter }: DeriveMotionRowsOptions,
): MotionRow[] {
  const collected: MotionRow[] = [];
  for (const [path, token] of Object.entries(resolved)) {
    if (filter && !matchPath(path, filter)) continue;
    if (!filter && !['transition', 'duration', 'cubicBezier'].includes(token.$type ?? '')) {
      continue;
    }
    const kind = token.$type as MotionRow['kind'] | undefined;
    if (!kind) continue;
    const spec = resolveMotionSpec(token, resolved);
    if (!spec) continue;
    collected.push({
      path,
      cssVar: resolveCssVar(path, project),
      token: token as RealisedToken,
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
}

export interface MotionPreviewViewProps {
  rows: MotionRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  /** Forwarded to each row's `MotionSample` (uniform presenter contract; unused for motion). */
  colorFormat: ColorFormat;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the motion preview. Owns the speed/replay controls'
 * local UI state and the `prefers-reduced-motion` read (a browser-environment
 * concern, not project data); renders from the derived `rows` view-model.
 * Composes the connected `MotionSample` as a child, feeding it this row's
 * already-resolved `token`/`cssVar` per the presenter contract.
 */
export function MotionPreviewView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  colorFormat,
  filter,
  caption,
}: MotionPreviewViewProps): ReactElement {
  const Sample = usePresenter('transition');
  const [speed, setSpeed] = useState<MotionSpeed>(1);
  const [run, setRun] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const captionText =
    caption ??
    `${rows.length} motion token${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No motion tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
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
          {Sample && (
            <Sample
              path={row.path}
              token={row.token}
              cssVar={row.cssVar}
              colorFormat={colorFormat}
              options={{ speed, runKey: run }}
            />
          )}
          <span className="sb-motion-preview__css-var">{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}

export function MotionPreview({ filter, caption }: MotionPreviewProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const rows = useMemo(
    () => deriveMotionRows(resolved, project, { filter }),
    [resolved, project, filter],
  );

  return (
    <MotionPreviewView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      colorFormat={colorFormat}
      filter={filter}
      caption={caption}
    />
  );
}
