import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface FontFamilySampleProps {
  /**
   * Token-path filter. Defaults to every `fontFamily` token. Use e.g.
   * `"font.ref.family.*"` to scope to the ref layer.
   */
  filter?: string;
  /** Override the sample text rendered for each token. */
  sample?: string;
  /** Override the caption. */
  caption?: string;
}

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
    alignItems: 'baseline',
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
  stack: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  sample: {
    fontSize: 22,
    lineHeight: 1.2,
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
  stack: string;
}

function stackString(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  return '';
}

export function FontFamilySample({
  filter = 'fontFamily',
  sample = 'The quick brown fox jumps over the lazy dog.',
  caption,
}: FontFamilySampleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    return Object.entries(resolved)
      .filter(([path, token]) => {
        if (token.$type !== 'fontFamily') return false;
        return globMatch(path, filter);
      })
      .toSorted(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([path, token]) => ({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        stack: stackString(token.$value),
      }));
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} fontFamily token${rows.length === 1 ? '' : 's'}${filter && filter !== 'fontFamily' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.empty}>No fontFamily tokens match this filter.</div>
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
            <span style={styles.stack}>{row.stack}</span>
          </div>
          <div style={{ ...styles.sample, fontFamily: row.cssVar }}>{sample}</div>
          <span style={styles.cssVar}>{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
