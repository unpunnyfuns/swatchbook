import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import './OpacityScale.css';
import { themeAttrs } from '#/internal/data-attr.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface OpacityScaleProps {
  /**
   * Token-path filter. Use `"number.opacity.*"` or `"opacity.*"` depending
   * on your layout. Omit to match every `$type: 'number'` token whose
   * value is in `[0, 1]` — the value-range check (applied alongside
   * the glob) keeps line-heights / z-indexes out.
   */
  filter?: string;
  /**
   * DTCG `$type` filter. `opacity` tokens where DTCG ships them as a
   * dedicated type; otherwise `number` (the common placement pre-spec).
   * Accepts either.
   */
  type?: 'number' | 'opacity';
  /**
   * Sample token rendered at each opacity. Defaults to `color.accent.bg`
   * — swap to whatever colour your system uses to demonstrate scrim /
   * overlay behaviour.
   */
  sampleColor?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order.
   * - `'value'` (default) — numeric, low opacity first.
   * - `'path'` — lexicographic on the dot-path.
   * - `'none'` — preserve project iteration order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

interface Row {
  path: string;
  cssVar: string;
  opacity: number;
  displayValue: string;
}

function toOpacity(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  return Number.NaN;
}

/**
 * Render each opacity token as a colored sample at that opacity over a
 * checkerboard backdrop, so the transparency is visually readable. The
 * number by itself (`0.4`) doesn't convey what the token looks like
 * applied to a surface; the sample does.
 *
 * Only tokens whose `$value` is a finite number between 0 and 1
 * inclusive are rendered — non-opacity `number` siblings (`line-height`,
 * `z-index`) fall out naturally.
 */
export function OpacityScale({
  filter,
  type = 'number',
  sampleColor = 'color.accent.bg',
  caption,
  sortBy = 'value',
  sortDir = 'asc',
}: OpacityScaleProps): ReactElement {
  const project = useProject();
  const { resolved, activePermutation, cssVarPrefix } = project;

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== type) return false;
      const v = toOpacity(token.$value);
      if (!Number.isFinite(v) || v < 0 || v > 1) return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => {
      const opacity = toOpacity(token.$value);
      return {
        path,
        cssVar: resolveCssVar(path, project),
        opacity,
        displayValue: String(opacity),
      };
    });
  }, [resolved, filter, type, project, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} opacity token${rows.length === 1 ? '' : 's'}${
      filter ? ` matching \`${filter}\`` : ''
    } · ${activePermutation}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activePermutation)}>
        <div className="sb-block__empty">No opacity tokens match this filter.</div>
      </div>
    );
  }

  const sampleColorVar = resolveCssVar(sampleColor, project);

  return (
    <div {...themeAttrs(cssVarPrefix, activePermutation)}>
      <div className="sb-block__caption">{captionText}</div>
      <div className="sb-opacity-scale__grid">
        {rows.map((row) => (
          <div key={row.path} className="sb-opacity-scale__card">
            <div
              className="sb-opacity-scale__swatch"
              style={
                {
                  '--sb-opacity-scale-color': sampleColorVar,
                  '--sb-opacity-scale-alpha': String(row.opacity),
                } as CSSProperties
              }
              aria-hidden
            />
            <div className="sb-opacity-scale__meta">
              <span className="sb-opacity-scale__path">{row.path}</span>
              <span className="sb-opacity-scale__value">{row.displayValue}</span>
              <span className="sb-opacity-scale__css-var">{row.cssVar}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
