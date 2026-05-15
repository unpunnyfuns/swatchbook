import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './ColorPalette.css';
import { useColorFormat } from '#/contexts.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
import { type SortBy, type SortDir, sortTokens } from '#/internal/sort-tokens.ts';
import { globMatch, resolveColorValue, resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface ColorPaletteProps {
  /**
   * Token-path filter. Defaults to every `color` token. Use e.g.
   * `"color.*"` to scope to the semantic layer, or `"color.palette.blue.*"`
   * for a single ref ramp.
   */
  filter?: string;
  /**
   * Grouping depth. Tokens are grouped by the first `groupBy` dot-segments
   * of their path. `1` yields a single `color` group; `2` yields
   * `color.surface`, `color.text`, `color.blue`, etc.
   *
   * If omitted, groupBy is derived from the filter: one level below the
   * filter's fixed prefix (segments before the first `*`), clamped so each
   * swatch still carries a leaf label. `"color.*"` → groups at
   * `color.<family>`; `"color.palette.blue.*"` collapses all shades into
   * one `color.blue` group because the tokens have no deeper level.
   */
  groupBy?: number;
  /** Override the section caption. */
  caption?: string;
  /**
   * Sort order within each group.
   * - `'path'` (default) — lexicographic on the dot-path.
   * - `'value'` — perceptual ordering: oklch L → C → H (ramps read
   *   light→dark, then warm→cool within each lightness band).
   * - `'none'` — preserve project iteration order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

interface Swatch {
  path: string;
  leaf: string;
  cssVar: string;
  value: string;
  outOfGamut: boolean;
}

/**
 * Count segments in the filter before the first glob (`*` / `**`).
 * `color.*` → 2; `color.surface.*` → 3; `color` → 1; undefined → 0.
 */
function fixedPrefixLength(filter: string | undefined): number {
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
  filter,
  groupBy,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: ColorPaletteProps): ReactElement {
  const project = useProject();
  const { resolved, activePermutation, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const groups = useMemo(() => {
    const filtered = Object.entries(resolved).filter(([path, token]) => {
      if (token.$type !== 'color') return false;
      return globMatch(path, filter);
    });
    const entries = sortTokens(filtered, { by: sortBy, dir: sortDir });

    const maxDepth = entries.reduce((m, [p]) => Math.max(m, p.split('.').length), 0);
    const effectiveGroupBy =
      groupBy ?? Math.min(fixedPrefixLength(filter) + 1, Math.max(maxDepth - 1, 1));

    const bucket = new Map<string, Swatch[]>();
    for (const [path, token] of entries) {
      const segments = path.split('.');
      const groupKey = segments.slice(0, effectiveGroupBy).join('.');
      const leaf = segments.slice(effectiveGroupBy).join('.') || segments.at(-1) || path;
      const list = bucket.get(groupKey) ?? [];
      const formatted = resolveColorValue(path, token.$value, colorFormat, project);
      list.push({
        path,
        leaf,
        cssVar: resolveCssVar(path, project),
        value: formatted.value,
        outOfGamut: formatted.outOfGamut,
      });
      bucket.set(groupKey, list);
    }

    return [...bucket.entries()].toSorted(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }, [resolved, filter, groupBy, project, colorFormat, sortBy, sortDir]);

  const totalCount = groups.reduce((acc, [, swatches]) => acc + swatches.length, 0);
  const captionText =
    caption ??
    `${totalCount} color${totalCount === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activePermutation}`;

  if (totalCount === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activePermutation)}>
        <div className="sb-block__empty">No color tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activePermutation)}>
      <div className="sb-block__caption">{captionText}</div>
      {groups.map(([group, swatches]) => (
        <section key={group} className="sb-color-palette__group">
          <div className="sb-color-palette__group-header">{group}</div>
          <div className="sb-color-palette__grid">
            {swatches.map((swatch) => (
              <div key={swatch.path} className="sb-color-palette__card">
                <div
                  className="sb-color-palette__swatch"
                  style={{ background: swatch.cssVar }}
                  aria-hidden
                />
                <div className="sb-color-palette__meta">
                  <span className="sb-color-palette__leaf">{swatch.leaf}</span>
                  <span className="sb-color-palette__value">
                    {swatch.value}
                    {swatch.outOfGamut && (
                      <span
                        title="Out of sRGB gamut for this format"
                        aria-label="out of gamut"
                        className="sb-color-palette__gamut-warn"
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
