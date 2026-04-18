import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { BorderSample } from '#/border-preview/BorderSample.tsx';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface BorderPreviewProps {
  /**
   * Token-path filter. Defaults to every `border` token. Use e.g.
   * `"border.sys.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
}

const styles = {
  wrapper: {
    fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
    fontSize: 'var(--sb-typography-sys-body-font-size, 14px)',
    color: 'var(--sb-color-sys-text-default, CanvasText)',
    background: 'var(--sb-color-sys-surface-default, Canvas)',
    padding: 12,
    borderRadius: 6,
  } satisfies CSSProperties,
  caption: {
    padding: '4px 0 12px',
    opacity: 0.7,
    fontSize: 12,
  } satisfies CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 140px 1fr',
    gap: 16,
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  } satisfies CSSProperties,
  path: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    opacity: 0.7,
  } satisfies CSSProperties,
  sampleCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies CSSProperties,
  breakdown: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 12,
    rowGap: 2,
  } satisfies CSSProperties,
  breakdownKey: {
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  empty: {
    padding: '24px 12px',
    textAlign: 'center',
    opacity: 0.6,
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

export function BorderPreview({ filter = 'border', caption }: BorderPreviewProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo(() => {
    const collected: Row[] = [];
    for (const [path, token] of Object.entries(resolved)) {
      if (token.$type !== 'border') continue;
      if (!globMatch(path, filter)) continue;
      collected.push({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        value: (token.$value ?? {}) as BorderValue,
      });
    }
    collected.sort((a, b) => a.path.localeCompare(b.path));
    return collected;
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} border${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.empty}>No border tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <div style={styles.caption}>{captionText}</div>
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
