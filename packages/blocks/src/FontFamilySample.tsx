import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import {
  BORDER_DEFAULT,
  captionStyle,
  emptyStyle,
  MONO_STACK,
  surfaceStyle,
} from '#/internal/styles.ts';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
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
  wrapper: surfaceStyle,
  caption: captionStyle,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 1fr auto',
    gap: 16,
    alignItems: 'baseline',
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
  stack: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  sample: {
    fontSize: 22,
    lineHeight: 1.2,
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  empty: emptyStyle,
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
      <div
        {...themeAttrs(cssVarPrefix, activeTheme)}
        style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
      >
        <div style={styles.empty}>No fontFamily tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div
      {...themeAttrs(cssVarPrefix, activeTheme)}
      style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
    >
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
