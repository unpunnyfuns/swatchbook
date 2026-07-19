import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './ColorPalette.css';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import type { RealisedToken } from '#/internal/composite-types.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { usePresenter } from '#/presenters/registry.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

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
  /**
   * Highest-precedence color format for this palette's values, overriding
   * an outer `ColorFormatContext` and the project's `defaultColorFormat`.
   * Omit to inherit the existing precedence chain (see `useColorFormat`).
   */
  colorFormat?: ColorFormat;
}

export interface ColorPaletteSwatch {
  path: string;
  cssVar: string;
  /**
   * Label relative to the swatch's group: the path segments after the
   * group's own prefix (e.g. `blue.50` for `color.palette.blue.50` under
   * group `color.palette`). Falls back to the full leaf/path when the
   * group already consumes every segment.
   */
  leaf: string;
  /** Realised token, fed to the `color` presenter per the presenter contract. */
  token: RealisedToken<'color'>;
}

export interface ColorPaletteGroup {
  group: string;
  swatches: ColorPaletteSwatch[];
}

// Count segments in the filter before the first glob (`*` / `**`).
// `color.*` → 2; `color.surface.*` → 3; `color` → 1; undefined → 0.
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

export interface DeriveColorPaletteGroupsOptions {
  filter?: string | undefined;
  groupBy?: number | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
}

/**
 * Pure derivation of the palette's grouped swatch rows from resolved project
 * data. Extracted so it is unit-testable without React or a store.
 */
export function deriveColorPaletteGroups(
  resolved: ProjectData['resolved'],
  listing: ProjectData['listing'],
  cssVarPrefix: ProjectData['cssVarPrefix'],
  { filter, groupBy, sortBy, sortDir }: DeriveColorPaletteGroupsOptions,
): ColorPaletteGroup[] {
  const projectFields = { listing, cssVarPrefix };
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'color') return false;
    return matchPath(path, filter);
  });
  const entries = sortTokens(filtered, { by: sortBy, dir: sortDir });

  const maxDepth = entries.reduce((m, [p]) => Math.max(m, p.split('.').length), 0);
  const effectiveGroupBy =
    groupBy ?? Math.min(fixedPrefixLength(filter) + 1, Math.max(maxDepth - 1, 1));

  const bucket = new Map<string, ColorPaletteSwatch[]>();
  for (const [path, token] of entries) {
    const segments = path.split('.');
    const groupKey = segments.slice(0, effectiveGroupBy).join('.');
    const leaf = segments.slice(effectiveGroupBy).join('.') || segments.at(-1) || path;
    const list = bucket.get(groupKey) ?? [];
    list.push({
      path,
      cssVar: resolveCssVar(path, projectFields),
      leaf,
      token: token as RealisedToken<'color'>,
    });
    bucket.set(groupKey, list);
  }

  return [...bucket.entries()]
    .toSorted(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([group, swatches]) => ({ group, swatches }));
}

export interface ColorPaletteViewProps {
  groups: ColorPaletteGroup[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  /** Forwarded to each swatch's `color` presenter. */
  colorFormat: ColorFormat;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the color palette. Renders from plain props;
 * composes the registry's `color` presenter per swatch, feeding it this
 * row's already-resolved `token`/`cssVar` per the presenter contract.
 */
export function ColorPaletteView({
  groups,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  colorFormat,
  filter,
  caption,
}: ColorPaletteViewProps): ReactElement {
  const Swatch = usePresenter('color');
  const totalCount = groups.reduce((acc, { swatches }) => acc + swatches.length, 0);
  const captionText =
    caption ??
    `${totalCount} color${totalCount === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (totalCount === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No color tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
      <div className="sb-block__caption">{captionText}</div>
      {groups.map(({ group, swatches }) => (
        <section key={group} className="sb-color-palette__group">
          <div className="sb-color-palette__group-header">{group}</div>
          <div className="sb-color-palette__grid">
            {swatches.map(
              (swatch) =>
                Swatch && (
                  <Swatch
                    key={swatch.path}
                    path={swatch.path}
                    token={swatch.token}
                    cssVar={swatch.cssVar}
                    colorFormat={colorFormat}
                    options={{ label: swatch.leaf }}
                  />
                ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ColorPalette({
  filter,
  groupBy,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
  colorFormat,
}: ColorPaletteProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix, listing } = project;
  const contextColorFormat = useColorFormat();
  const format = colorFormat ?? contextColorFormat;

  const groups = useMemo(
    () =>
      deriveColorPaletteGroups(resolved, listing, cssVarPrefix, {
        filter,
        groupBy,
        sortBy,
        sortDir,
      }),
    [resolved, listing, cssVarPrefix, filter, groupBy, sortBy, sortDir],
  );

  return (
    <ColorPaletteView
      groups={groups}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      colorFormat={format}
      filter={filter}
      caption={caption}
    />
  );
}
