import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import {
  BORDER_DEFAULT,
  MONO_STACK,
  TEXT_MUTED,
  captionStyle,
  emptyStyle,
  surfaceStyle,
} from '#/internal/styles.tsx';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface FontWeightScaleProps {
  /**
   * Token-path filter. Defaults to every `fontWeight` token. Use e.g.
   * `"font.ref.weight.*"` to scope to the ref layer.
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
  empty: emptyStyle,
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 1fr auto',
    gap: 16,
    alignItems: 'baseline',
    padding: '12px 0',
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
  value: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: TEXT_MUTED,
  } satisfies CSSProperties,
  sample: {
    fontSize: 28,
    lineHeight: 1,
  } satisfies CSSProperties,
  cssVar: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    color: TEXT_MUTED,
  } satisfies CSSProperties,
};

interface Row {
  path: string;
  cssVar: string;
  display: string;
  weight: number;
}

function toWeight(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : Number.NaN;
  }
  return Number.NaN;
}

export function FontWeightScale({
  filter = 'fontWeight',
  sample = 'Aa',
  caption,
}: FontWeightScaleProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const rows = useMemo<Row[]>(() => {
    const collected: Row[] = [];
    for (const [path, token] of Object.entries(resolved)) {
      if (token.$type !== 'fontWeight') continue;
      if (!globMatch(path, filter)) continue;
      collected.push({
        path,
        cssVar: makeCssVar(path, cssVarPrefix),
        display: token.$value == null ? '' : String(token.$value),
        weight: toWeight(token.$value),
      });
    }
    collected.sort((a, b) => {
      if (Number.isFinite(a.weight) && Number.isFinite(b.weight)) return a.weight - b.weight;
      return a.path.localeCompare(b.path, undefined, { numeric: true });
    });
    return collected;
  }, [resolved, filter, cssVarPrefix]);

  const captionText =
    caption ??
    `${rows.length} fontWeight token${rows.length === 1 ? '' : 's'}${filter && filter !== 'fontWeight' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div
        {...themeAttrs(cssVarPrefix, activeTheme)}
        style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
      >
        <div style={styles.empty}>No fontWeight tokens match this filter.</div>
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
            <span style={styles.value}>{row.display}</span>
          </div>
          <div
            style={{
              ...styles.sample,
              fontWeight: row.cssVar as unknown as CSSProperties['fontWeight'],
            }}
          >
            {sample}
          </div>
          <span style={styles.cssVar}>{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}
