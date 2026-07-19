import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { usePresenter } from '#/presenters/registry.ts';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

export interface FontWeightScaleProps {
  /**
   * Token-path filter. Defaults to every `fontWeight` token. Use e.g.
   * `"font.weight.*"` to scope to the ref layer.
   */
  filter?: string;
  /** Override the sample text rendered for each token. */
  sample?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order.
   * - `'value'` (default) — ascending numeric by weight (100 → 900).
   * - `'path'` — lexicographic on the dot-path.
   * - `'none'` — preserve project iteration order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

export interface FontWeightRow {
  path: string;
  cssVar: string;
  /** Realised token, fed to `FontWeightSpecimen` per the presenter contract. */
  token: RealisedToken<'fontWeight'>;
}

export interface DeriveFontWeightRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
}

/**
 * Pure derivation of the scale's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveFontWeightRows(
  resolved: ProjectData['resolved'],
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
  { filter, sortBy, sortDir }: DeriveFontWeightRowsOptions,
): FontWeightRow[] {
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'fontWeight') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
    path,
    cssVar: resolveCssVar(path, project),
    token: token as RealisedToken<'fontWeight'>,
  }));
}

export interface FontWeightScaleViewProps {
  rows: FontWeightRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  sample: string;
  /** Forwarded to each row's `FontWeightSpecimen` (uniform presenter contract; unused for fontWeight). */
  colorFormat: ColorFormat;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the font-weight scale. Renders from plain props;
 * composes the connected `FontWeightSpecimen` as a child, feeding it this
 * row's already-resolved `token`/`cssVar` per the presenter contract.
 */
export function FontWeightScaleView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  sample,
  colorFormat,
  filter,
  caption,
}: FontWeightScaleViewProps): ReactElement {
  const Specimen = usePresenter('fontWeight');
  const captionText =
    caption ??
    `${rows.length} fontWeight token${rows.length === 1 ? '' : 's'}${filter && filter !== 'fontWeight' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No fontWeight tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map(
        (row) =>
          Specimen && (
            <Specimen
              key={row.path}
              path={row.path}
              token={row.token}
              cssVar={row.cssVar}
              colorFormat={colorFormat}
              options={{ sample }}
            />
          ),
      )}
    </div>
  );
}

export function FontWeightScale({
  filter,
  sample = 'Aa',
  caption,
  sortBy = 'value',
  sortDir = 'asc',
}: FontWeightScaleProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const rows = useMemo(
    () => deriveFontWeightRows(resolved, project, { filter, sortBy, sortDir }),
    [resolved, project, filter, sortBy, sortDir],
  );

  return (
    <FontWeightScaleView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      sample={sample}
      colorFormat={colorFormat}
      filter={filter}
      caption={caption}
    />
  );
}
