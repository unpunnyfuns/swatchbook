import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/internal/format-color.ts';
import { BORDER_FAINT, emptyStyle, MONO_STACK, surfaceStyle } from '#/internal/styles.ts';
import { formatValue, globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface TokenTableProps {
  /**
   * Token-path filter. `"color.sys.*"` matches every `color.sys.…` token;
   * omit to include everything. Combines with `type` (both must match).
   */
  filter?: string;
  /** Restrict to one DTCG `$type`. */
  type?: string;
  /** Show the CSS variable reference column. Defaults to `true`. */
  showVar?: boolean;
  /** Override the table caption. */
  caption?: string;
}

const styles = {
  wrapper: surfaceStyle,
  empty: emptyStyle,
  caption: {
    captionSide: 'top',
    textAlign: 'left',
    padding: '8px 0',
    opacity: 0.7,
    fontSize: 12,
  } satisfies React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  } satisfies React.CSSProperties,
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    borderBottom: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.3))',
  } satisfies React.CSSProperties,
  td: {
    padding: '8px 12px',
    borderBottom: BORDER_FAINT,
    verticalAlign: 'top',
  } satisfies React.CSSProperties,
  path: {
    fontFamily: MONO_STACK,
    fontSize: 12,
  } satisfies React.CSSProperties,
  typePill: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.15))',
  } satisfies React.CSSProperties,
  value: {
    fontFamily: MONO_STACK,
    fontSize: 12,
    opacity: 0.85,
    wordBreak: 'break-all',
  } satisfies React.CSSProperties,
  swatch: {
    display: 'inline-block',
    width: 14,
    height: 14,
    verticalAlign: 'middle',
    marginRight: 6,
    borderRadius: 3,
    border: '1px solid var(--sb-color-sys-border-default, rgba(0,0,0,0.1))',
  } satisfies React.CSSProperties,
};

export function TokenTable({
  filter,
  type,
  showVar = true,
  caption,
}: TokenTableProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();
  const colorFormat = useColorFormat();

  const rows = useMemo(() => {
    const entries = Object.entries(resolved)
      .filter(([path, token]) => {
        if (!globMatch(path, filter)) return false;
        if (type && token.$type !== type) return false;
        return true;
      })
      .toSorted(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    return entries.map(([path, token]) => {
      const isColor = token.$type === 'color';
      const color = isColor ? formatColor(token.$value, colorFormat) : null;
      return {
        path,
        type: token.$type ?? '',
        value: color ? color.value : formatValue(token.$value),
        outOfGamut: color?.outOfGamut ?? false,
        description: token.$description ?? '',
        cssVar: makeCssVar(path, cssVarPrefix),
        isColor,
      };
    });
  }, [resolved, filter, type, cssVarPrefix, colorFormat]);

  const captionText =
    caption ??
    `${rows.length} token${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''}${type ? ` · $type=${type}` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.empty}>No tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <table style={styles.table}>
        <caption style={styles.caption}>{captionText}</caption>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: showVar ? '28%' : '40%' }} />
          {showVar && <col style={{ width: '24%' }} />}
          <col />
        </colgroup>
        <thead>
          <tr>
            <th style={styles.th}>Path</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Value</th>
            {showVar && <th style={styles.th}>CSS var</th>}
            <th style={styles.th}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path}>
              <td style={{ ...styles.td, ...styles.path }}>{row.path}</td>
              <td style={styles.td}>
                {row.type && <span style={styles.typePill}>{row.type}</span>}
              </td>
              <td style={{ ...styles.td, ...styles.value }}>
                {row.isColor && (
                  <span style={{ ...styles.swatch, background: row.cssVar }} aria-hidden />
                )}
                <span>{row.value}</span>
                {row.outOfGamut && (
                  <span
                    title='Out of sRGB gamut for this format'
                    aria-label='out of gamut'
                    style={{ marginLeft: 6 }}
                  >
                    ⚠
                  </span>
                )}
              </td>
              {showVar && <td style={{ ...styles.td, ...styles.value }}>{row.cssVar}</td>}
              <td style={styles.td}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
