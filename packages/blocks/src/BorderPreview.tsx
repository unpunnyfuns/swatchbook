import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './BorderPreview.css';
import { BorderSample } from '#/border-preview/BorderSample.tsx';
import { useColorFormat } from '#/contexts.ts';
import { type ColorFormat, formatColor } from '#/format-color.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface BorderPreviewProps {
  /**
   * Token-path filter. Defaults to every `border` token. Use e.g.
   * `"border.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order. `'path'` (default) sorts lexicographically on the
   * dot-path; `'value'` falls through to path (borders don't have a
   * single-axis ordering); `'none'` preserves project order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

interface BorderValue {
  color?: unknown;
  width?: unknown;
  style?: unknown;
}

interface Row {
  path: string;
  cssVar: string;
  value: BorderValue;
}

function formatDimension(raw: unknown): string {
  if (raw == null) return '—';
  if (typeof raw === 'number') return String(raw);
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const v = raw as { value?: unknown; unit?: unknown };
    if (typeof v.value === 'number' && typeof v.unit === 'string') {
      return `${v.value}${v.unit}`;
    }
  }
  return JSON.stringify(raw);
}

function formatSubColor(raw: unknown, format: ColorFormat): string {
  if (raw == null) return '—';
  return formatColor(raw, format).value;
}

export function BorderPreview({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: BorderPreviewProps): ReactElement {
  const project = useProject();
  const { resolved, activePermutation, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'border') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
      path,
      cssVar: resolveCssVar(path, project),
      value: (token.$value ?? {}) as BorderValue,
    }));
  }, [resolved, filter, project, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} border${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activePermutation}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activePermutation)}>
        <div className="sb-block__empty">No border tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activePermutation)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-border-preview__row">
          <div className="sb-border-preview__meta">
            <span className="sb-border-preview__path">{row.path}</span>
            <span className="sb-border-preview__css-var">{row.cssVar}</span>
          </div>
          <div className="sb-border-preview__sample-cell">
            <BorderSample path={row.path} />
          </div>
          <div className="sb-border-preview__breakdown">
            <span className="sb-border-preview__breakdown-key">width</span>
            <span>{formatDimension(row.value.width)}</span>
            <span className="sb-border-preview__breakdown-key">style</span>
            <span>{row.value.style != null ? String(row.value.style) : '—'}</span>
            <span className="sb-border-preview__breakdown-key">color</span>
            <span>{formatSubColor(row.value.color, colorFormat)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
