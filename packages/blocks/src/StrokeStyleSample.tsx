import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { formatValue, globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface StrokeStyleSampleProps {
  /**
   * Token-path filter. Defaults to every `strokeStyle` token. Use e.g.
   * `"stroke.ref.style.*"` to scope to the ref layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
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

const styles = {
  wrapper: {
    fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
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
    gridTemplateColumns: 'minmax(160px, 220px) 1fr auto',
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
  value: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  line: {
    height: 0,
    borderTopWidth: 4,
    borderTopColor: 'var(--sb-color-sys-text-default, CanvasText)',
    width: '100%',
  } satisfies CSSProperties,
  objectFallback: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  empty: {
    padding: '24px 12px',
    textAlign: 'center',
    opacity: 0.6,
  } satisfies CSSProperties,
};

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
  filter = 'strokeStyle',
  caption,
}: StrokeStyleSampleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    return Object.entries(resolved)
      .filter(([path, token]) => {
        if (token.$type !== 'strokeStyle') return false;
        return globMatch(path, filter);
      })
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([path, token]) => ({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        displayValue: formatValue(token.$value),
        cssStyle: extractCssStyle(token.$value),
      }));
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} strokeStyle token${rows.length === 1 ? '' : 's'}${filter && filter !== 'strokeStyle' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.empty}>No strokeStyle tokens match this filter.</div>
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
            <span style={styles.value}>{row.displayValue}</span>
          </div>
          {row.cssStyle ? (
            <div
              style={{
                ...styles.line,
                borderTopStyle: row.cssStyle as CSSProperties['borderTopStyle'],
              }}
              aria-hidden
            />
          ) : (
            <span style={styles.objectFallback}>
              Object-form (dashArray + lineCap) — no pure CSS `border-style` equivalent.
            </span>
          )}
          <span style={styles.cssVar}>{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
