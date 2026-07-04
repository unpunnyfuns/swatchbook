import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import './TypographyScale.css';
import type { TypographyValue } from '#/internal/composite-types.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';

// Dimension sub-values in DTCG 2025.10 use a `{ value, unit }` envelope
// — narrow once here so the local `asDimension` helper doesn't need
// to re-validate keys at every read.
interface DimensionLike {
  value?: unknown;
  unit?: unknown;
}

export interface TypographyScaleProps {
  /**
   * Token-path filter. Defaults to every `typography` token. Use e.g.
   * `"typography.*"` to scope to the semantic layer.
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

export interface TypographyRow {
  path: string;
  sampleStyle: CSSProperties;
  specs: string;
}

function asDimension(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  if (typeof raw === 'object') {
    const v = raw as DimensionLike;
    if (v.value !== undefined && v.unit !== undefined) return `${String(v.value)}${String(v.unit)}`;
  }
  return undefined;
}

function asFontFamily(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  return undefined;
}

function buildRow(path: string, composite: TypographyValue): TypographyRow {
  const fontFamily = asFontFamily(composite.fontFamily);
  const fontSize = asDimension(composite.fontSize);
  const fontWeight = composite.fontWeight == null ? undefined : String(composite.fontWeight);
  const lineHeight = composite.lineHeight == null ? undefined : String(composite.lineHeight);
  const letterSpacing = asDimension(composite.letterSpacing);

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

export interface DeriveTypographyRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
}

/**
 * Pure derivation of the scale's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveTypographyRows(
  resolved: ProjectData['resolved'],
  { filter, sortBy, sortDir }: DeriveTypographyRowsOptions,
): TypographyRow[] {
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'typography') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => {
    const value = token.$value;
    if (!value || typeof value !== 'object') {
      return { path, sampleStyle: {}, specs: '' };
    }
    return buildRow(path, value as TypographyValue);
  });
}

export interface TypographyScaleViewProps {
  rows: TypographyRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  sample: string;
  filter?: string | undefined;
  caption?: string | undefined;
}

/** Pure presentation for the typography scale. Renders from plain props. */
export function TypographyScaleView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  sample,
  filter,
  caption,
}: TypographyScaleViewProps): ReactElement {
  const captionText =
    caption ??
    `${rows.length} typography token${rows.length === 1 ? '' : 's'}${filter && filter !== 'typography' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No typography tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
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

export function TypographyScale({
  filter,
  sample = 'The quick brown fox jumps over the lazy dog.',
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: TypographyScaleProps): ReactElement {
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = useProject();

  const rows = useMemo(
    () => deriveTypographyRows(resolved, { filter, sortBy, sortDir }),
    [resolved, filter, sortBy, sortDir],
  );

  return (
    <TypographyScaleView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      sample={sample}
      filter={filter}
      caption={caption}
    />
  );
}
