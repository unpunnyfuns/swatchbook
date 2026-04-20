import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import './TypographyScale.css';
import { themeAttrs } from '#/internal/data-attr.ts';
import { globMatch, useProject } from '#/internal/use-project.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';

export interface TypographyScaleProps {
  /**
   * Token-path filter. Defaults to every `typography` token. Use e.g.
   * `"typography.sys.*"` to scope to the semantic layer.
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
  sampleStyle: CSSProperties;
  specs: string;
}

function asDimension(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  if (typeof raw === 'object') {
    const v = raw as Record<string, unknown>;
    if ('value' in v && 'unit' in v) return `${String(v['value'])}${String(v['unit'])}`;
  }
  return undefined;
}

function asFontFamily(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  return undefined;
}

function buildRow(path: string, composite: Record<string, unknown>): Row {
  const fontFamily = asFontFamily(composite['fontFamily']);
  const fontSize = asDimension(composite['fontSize']);
  const fontWeight = composite['fontWeight'] == null ? undefined : String(composite['fontWeight']);
  const lineHeight = composite['lineHeight'] == null ? undefined : String(composite['lineHeight']);
  const letterSpacing = asDimension(composite['letterSpacing']);

  const sampleStyle: CSSProperties = {};
  if (fontFamily) sampleStyle.fontFamily = fontFamily;
  if (fontSize) sampleStyle.fontSize = fontSize;
  if (fontWeight) sampleStyle.fontWeight = fontWeight as CSSProperties['fontWeight'];
  if (lineHeight) sampleStyle.lineHeight = lineHeight;
  if (letterSpacing) sampleStyle.letterSpacing = letterSpacing;

  const parts = [
    fontSize,
    fontWeight ? `w${fontWeight}` : undefined,
    lineHeight ? `lh ${lineHeight}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return { path, sampleStyle, specs: parts };
}

export function TypographyScale({
  filter,
  sample = 'The quick brown fox jumps over the lazy dog.',
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: TypographyScaleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'typography') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => {
      const value = token.$value;
      if (!value || typeof value !== 'object') {
        return { path, sampleStyle: {}, specs: '' };
      }
      return buildRow(path, value as Record<string, unknown>);
    });
  }, [resolved, filter, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} typography token${rows.length === 1 ? '' : 's'}${filter && filter !== 'typography' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)}>
        <div className="sb-block__empty">No typography tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-typography-scale__row">
          <div className="sb-typography-scale__meta">
            <span className="sb-typography-scale__path">{row.path}</span>
            {row.specs && <span className="sb-typography-scale__specs">{row.specs}</span>}
          </div>
          <div style={row.sampleStyle}>{sample}</div>
        </div>
      ))}
    </div>
  );
}
