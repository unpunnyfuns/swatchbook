import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { BorderSample } from '#/border-preview/BorderSample.tsx';
import { BORDER_DEFAULT, MONO_STACK, TEXT_MUTED } from '#/internal/styles.tsx';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface BorderPreviewProps {
  /**
   * Token-path filter. Defaults to every `border` token. Use e.g.
   * `"border.sys.*"` to scope to the semantic layer.
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

const styles = {
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 140px 1fr',
    gap: 16,
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: BORDER_DEFAULT,
  } satisfies CSSProperties,
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  } satisfies CSSProperties,
  path: {
    fontFamily: MONO_STACK,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    opacity: 0.7,
  } satisfies CSSProperties,
  sampleCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies CSSProperties,
  breakdown: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 12,
    rowGap: 2,
  } satisfies CSSProperties,
  breakdownKey: {
    color: TEXT_MUTED,
  } satisfies CSSProperties,
};

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

function formatColor(raw: unknown): string {
  if (raw == null) return '—';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const v = raw as { components?: unknown; alpha?: unknown; colorSpace?: unknown };
    if (Array.isArray(v.components) && typeof v.colorSpace === 'string') {
      const parts = v.components.map((c) => (typeof c === 'number' ? c.toFixed(3) : String(c)));
      const alpha = typeof v.alpha === 'number' && v.alpha !== 1 ? `, ${v.alpha}` : '';
      return `${v.colorSpace}(${parts.join(' ')}${alpha})`;
    }
  }
  return JSON.stringify(raw);
}

export function BorderPreview({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: BorderPreviewProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'border') return false;
      return globMatch(path, filter);
    });
    return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
      path,
      cssVar: makeCssVar(path, cssVarPrefix),
      value: (token.$value ?? {}) as BorderValue,
    }));
  }, [resolved, filter, cssVarPrefix, sortBy, sortDir]);

  const captionText =
    caption ??
    `${rows.length} border${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)} style={chromeAliases(cssVarPrefix)}>
        <div className="sb-block__empty">No border tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)} style={chromeAliases(cssVarPrefix)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} style={styles.row}>
          <div style={styles.meta}>
            <span style={styles.path}>{row.path}</span>
            <span style={styles.cssVar}>{row.cssVar}</span>
          </div>
          <div style={styles.sampleCell}>
            <BorderSample path={row.path} />
          </div>
          <div style={styles.breakdown}>
            <span style={styles.breakdownKey}>width</span>
            <span>{formatDimension(row.value.width)}</span>
            <span style={styles.breakdownKey}>style</span>
            <span>{row.value.style != null ? String(row.value.style) : '—'}</span>
            <span style={styles.breakdownKey}>color</span>
            <span>{formatColor(row.value.color)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
