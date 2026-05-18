import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './FontWeightScale.css';
import { cssVarAsNumber } from '#/internal/css-var-style.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface FontWeightScaleProps {
  /**
   * Token-path filter. Defaults to every `fontWeight` token. Use e.g.
   * `"font.weight.*"` to scope to the ref layer.
   */
  filter?: string;
  /** Override the sample text rendered for each token. */
  sample?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order.
   * - `'value'` (default) — ascending numeric by weight (100 → 900).
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
  display: string;
  weight: number;
}

function toWeight(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : Number.NaN;
  }
  return Number.NaN;
}

export function FontWeightScale({
  filter,
  sample = 'Aa',
  caption,
  sortBy = 'value',
  sortDir = 'asc',
}: FontWeightScaleProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, cssVarPrefix } = project;

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'fontWeight') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
      path,
      cssVar: resolveCssVar(path, project),
      display: token.$value == null ? '' : String(token.$value),
      weight: toWeight(token.$value),
    }));
  }, [resolved, filter, project, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} fontWeight token${rows.length === 1 ? '' : 's'}${filter && filter !== 'fontWeight' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)}>
        <div className="sb-block__empty">No fontWeight tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-font-weight-scale__row">
          <div className="sb-font-weight-scale__meta">
            <span className="sb-font-weight-scale__path">{row.path}</span>
            <span className="sb-font-weight-scale__value">{row.display}</span>
          </div>
          <div
            className="sb-font-weight-scale__sample"
            style={{ fontWeight: cssVarAsNumber(row.cssVar) }}
          >
            {sample}
          </div>
          <span className="sb-font-weight-scale__css-var">{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
