import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './FontFamilySample.css';
import { themeAttrs } from '#/internal/data-attr.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';

export interface FontFamilySampleProps {
  /**
   * Token-path filter. Defaults to every `fontFamily` token. Use e.g.
   * `"font.family.*"` to scope to the ref layer.
   */
  filter?: string;
  /** Override the sample text rendered for each token. */
  sample?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order. `'path'` (default) sorts lexicographically on the
   * dot-path; `'value'` ordering falls through to path for this block's
   * type (composite / non-numeric); `'none'` preserves project order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

interface Row {
  path: string;
  cssVar: string;
  stack: string;
}

function stackString(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  return '';
}

export function FontFamilySample({
  filter,
  sample = 'The quick brown fox jumps over the lazy dog.',
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: FontFamilySampleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'fontFamily') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
      path,
      cssVar: makeCssVar(path, cssVarPrefix),
      stack: stackString(token.$value),
    }));
  }, [resolved, filter, cssVarPrefix, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} fontFamily token${rows.length === 1 ? '' : 's'}${filter && filter !== 'fontFamily' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)}>
        <div className="sb-block__empty">No fontFamily tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-font-family-sample__row">
          <div className="sb-font-family-sample__meta">
            <span className="sb-font-family-sample__path">{row.path}</span>
            <span className="sb-font-family-sample__stack">{row.stack}</span>
          </div>
          <div className="sb-font-family-sample__sample" style={{ fontFamily: row.cssVar }}>
            {sample}
          </div>
          <span className="sb-font-family-sample__css-var">{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
