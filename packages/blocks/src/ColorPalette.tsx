import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { formatValue, globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface ColorPaletteProps {
  /**
   * Token-path filter. Defaults to every `color` token. Use e.g.
   * `"color.sys.*"` to scope to the semantic layer, or `"color.ref.blue.*"`
   * for a single ref ramp.
   */
  filter?: string;
  /**
   * Grouping depth. Tokens are grouped by the first `groupBy` dot-segments
   * of their path. `2` yields groups like `color.sys`, `color.ref`; `3`
   * yields `color.sys.surface`, `color.sys.text`, etc. Defaults to `3`.
   */
  groupBy?: number;
  /** Override the section caption. */
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
  } satisfies React.CSSProperties,
  caption: {
    padding: '4px 0 12px',
    opacity: 0.7,
    fontSize: 12,
  } satisfies React.CSSProperties,
  group: {
    marginBottom: 20,
  } satisfies React.CSSProperties,
  groupHeader: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: 8,
  } satisfies React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 8,
  } satisfies React.CSSProperties,
  card: {
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
    borderRadius: 6,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  } satisfies React.CSSProperties,
  swatch: {
    height: 56,
    width: '100%',
    borderBottom: '1px solid var(--sb-color-sys-border-default, rgba(0,0,0,0.08))',
  } satisfies React.CSSProperties,
  meta: {
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  } satisfies React.CSSProperties,
  leaf: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  } satisfies React.CSSProperties,
  value: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    opacity: 0.7,
  } satisfies React.CSSProperties,
  empty: {
    padding: '24px 12px',
    textAlign: 'center',
    opacity: 0.6,
  } satisfies React.CSSProperties,
};

interface Swatch {
  path: string;
  leaf: string;
  cssVar: string;
  value: string;
}

export function ColorPalette({
  filter = 'color',
  groupBy = 3,
  caption,
}: ColorPaletteProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const groups = useMemo(() => {
    const bucket = new Map<string, Swatch[]>();
    const entries = Object.entries(resolved)
      .filter(([path, token]) => {
        if (token.$type !== 'color') return false;
        return globMatch(path, filter);
      })
      .toSorted(([a], [b]) => a.localeCompare(b));

    for (const [path, token] of entries) {
      const segments = path.split('.');
      const groupKey = segments.slice(0, groupBy).join('.');
      const leaf = segments.slice(groupBy).join('.') || segments.at(-1) || path;
      const list = bucket.get(groupKey) ?? [];
      list.push({
        path,
        leaf,
        cssVar: makeCssVar(path, cssVarPrefix),
        value: formatValue(token.$value),
      });
      bucket.set(groupKey, list);
    }

    return [...bucket.entries()].toSorted(([a], [b]) => a.localeCompare(b));
  }, [resolved, filter, groupBy, cssVarPrefix]);

  const totalCount = groups.reduce((acc, [, swatches]) => acc + swatches.length, 0);
  const captionText =
    caption ??
    `${totalCount} color${totalCount === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (totalCount === 0) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.empty}>No color tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <div style={styles.caption}>{captionText}</div>
      {groups.map(([group, swatches]) => (
        <section key={group} style={styles.group}>
          <div style={styles.groupHeader}>{group}</div>
          <div style={styles.grid}>
            {swatches.map((swatch) => (
              <div key={swatch.path} style={styles.card}>
                <div style={{ ...styles.swatch, background: swatch.cssVar }} aria-hidden />
                <div style={styles.meta}>
                  <span style={styles.leaf}>{swatch.leaf}</span>
                  <span style={styles.value}>{swatch.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
