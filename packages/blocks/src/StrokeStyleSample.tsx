import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import './StrokeStyleSample.css';
import { themeAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';

export interface StrokeStyleSampleProps {
  /**
   * Token-path filter. Defaults to every `strokeStyle` token. Use e.g.
   * `"stroke.ref.style.*"` to scope to the ref layer.
   */
  filter?: string;
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

const STRING_STYLES = new Set([
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'outset',
  'inset',
]);

interface Row {
  path: string;
  cssVar: string;
  displayValue: string;
  cssStyle: string | null;
}

function extractCssStyle(value: unknown): string | null {
  if (typeof value === 'string' && STRING_STYLES.has(value)) return value;
  return null;
}

export function StrokeStyleSample({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: StrokeStyleSampleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'strokeStyle') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
      path,
      cssVar: makeCssVar(path, cssVarPrefix),
      displayValue: formatTokenValue(token.$value, token.$type, 'raw'),
      cssStyle: extractCssStyle(token.$value),
    }));
  }, [resolved, filter, cssVarPrefix, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} strokeStyle token${rows.length === 1 ? '' : 's'}${filter && filter !== 'strokeStyle' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)}>
        <div className="sb-block__empty">No strokeStyle tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-stroke-style-sample__row">
          <div className="sb-stroke-style-sample__meta">
            <span className="sb-stroke-style-sample__path">{row.path}</span>
            <span className="sb-stroke-style-sample__value">{row.displayValue}</span>
          </div>
          {row.cssStyle ? (
            <div
              className="sb-stroke-style-sample__line"
              style={{
                borderTopStyle: row.cssStyle as CSSProperties['borderTopStyle'],
              }}
              aria-hidden
            />
          ) : (
            <span className="sb-stroke-style-sample__object-fallback">
              Object-form (dashArray + lineCap) — no pure CSS `border-style` equivalent.
            </span>
          )}
          <span className="sb-stroke-style-sample__css-var">{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
