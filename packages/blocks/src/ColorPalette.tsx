import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import {
  BORDER_DEFAULT,
  captionStyle,
  emptyStyle,
  MONO_STACK,
  surfaceStyle,
} from '#/internal/styles.ts';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { globMatch, makeCssVar, useProject } from '#/internal/use-project.ts';

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
   * yields `color.sys.surface`, `color.sys.text`, etc.
   *
   * If omitted, groupBy is derived from the filter: one level below the
   * filter's fixed prefix (segments before the first `*`), clamped so each
   * swatch still carries a leaf label. `"color.sys.*"` → groups at
   * `color.sys.<family>`; `"color.ref.blue.*"` collapses all shades into
   * one `color.ref.blue` group because the tokens have no deeper level.
   */
  groupBy?: number;
  /** Override the section caption. */
  caption?: string;
}

const styles = {
  wrapper: surfaceStyle,
  caption: captionStyle,
  empty: emptyStyle,
  group: {
    marginBottom: 20,
  } satisfies React.CSSProperties,
  groupHeader: {
    fontFamily: MONO_STACK,
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
    border: BORDER_DEFAULT,
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
    fontFamily: MONO_STACK,
    fontSize: 12,
  } satisfies React.CSSProperties,
  value: {
    fontFamily: MONO_STACK,
    fontSize: 11,
    opacity: 0.7,
  } satisfies React.CSSProperties,
};

interface Swatch {
  path: string;
  leaf: string;
  cssVar: string;
  value: string;
  outOfGamut: boolean;
}

/**
 * Count segments in the filter before the first glob (`*` / `**`).
 * `color.ref.*` → 2; `color.sys.surface.*` → 3; `color` → 1; undefined → 0.
 *
 * @internal Exported for tests; not part of the public API.
 */
export function fixedPrefixLength(filter: string | undefined): number {
  if (!filter) return 0;
  const segments = filter.split('.');
  let fixed = 0;
  for (const seg of segments) {
    if (seg === '*' || seg === '**') break;
    fixed += 1;
  }
  return fixed;
}

export function ColorPalette({
  filter = 'color',
  groupBy,
  caption,
}: ColorPaletteProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();
  const colorFormat = useColorFormat();

  const groups = useMemo(() => {
    const entries = Object.entries(resolved)
      .filter(([path, token]) => {
        if (token.$type !== 'color') return false;
        return globMatch(path, filter);
      })
      .toSorted(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

    const maxDepth = entries.reduce((m, [p]) => Math.max(m, p.split('.').length), 0);
    /**
     * Auto-derive: group one level below the filter's fixed prefix, but
     * clamp so each swatch retains at least one leaf segment. A filter
     * like `color.ref.blue.*` (fixed length 3) with only 4-segment tokens
     * would try groupBy=4 → one-per-group; clamp to `maxDepth - 1` so the
     * whole ramp lands in one group with each shade as a leaf.
     */
    const effectiveGroupBy =
      groupBy ?? Math.min(fixedPrefixLength(filter) + 1, Math.max(maxDepth - 1, 1));

    const bucket = new Map<string, Swatch[]>();
    for (const [path, token] of entries) {
      const segments = path.split('.');
      const groupKey = segments.slice(0, effectiveGroupBy).join('.');
      const leaf = segments.slice(effectiveGroupBy).join('.') || segments.at(-1) || path;
      const list = bucket.get(groupKey) ?? [];
      const formatted = formatColor(token.$value, colorFormat);
      list.push({
        path,
        leaf,
        cssVar: makeCssVar(path, cssVarPrefix),
        value: formatted.value,
        outOfGamut: formatted.outOfGamut,
      });
      bucket.set(groupKey, list);
    }

    return [...bucket.entries()].toSorted(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }, [resolved, filter, groupBy, cssVarPrefix, colorFormat]);

  const totalCount = groups.reduce((acc, [, swatches]) => acc + swatches.length, 0);
  const captionText =
    caption ??
    `${totalCount} color${totalCount === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (totalCount === 0) {
    return (
      <div
        {...themeAttrs(cssVarPrefix, activeTheme)}
        style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
      >
        <div style={styles.empty}>No color tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)} style={styles.wrapper}>
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
                  <span style={styles.value}>
                    {swatch.value}
                    {swatch.outOfGamut && (
                      <span
                        title='Out of sRGB gamut for this format'
                        aria-label='out of gamut'
                        style={{ marginLeft: 4 }}
                      >
                        {' '}
                        ⚠
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
