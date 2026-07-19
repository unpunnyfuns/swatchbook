import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { usePresenter } from '#/presenters/registry.ts';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';

export interface FontFamilyPreviewProps {
  /**
   * Token-path filter. Defaults to every `fontFamily` token. Use e.g.
   * `"font.family.*"` to scope to the ref layer.
   */
  filter?: string;
  /** Override the sample text rendered for each token. */
  sample?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order. `'path'` (default) sorts lexicographically on the
   * dot-path; `'value'` ordering falls through to path for this block's
   * type (composite / non-numeric); `'none'` preserves project order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
}

export interface FontFamilyRow {
  path: string;
  cssVar: string;
  /** Realised token, fed to `FontFamilySpecimen` per the presenter contract. */
  token: RealisedToken<'fontFamily'>;
}

export interface DeriveFontFamilyRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
}

/**
 * Pure derivation of the preview's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveFontFamilyRows(
  resolved: ProjectData['resolved'],
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
  { filter, sortBy, sortDir }: DeriveFontFamilyRowsOptions,
): FontFamilyRow[] {
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'fontFamily') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
    path,
    cssVar: resolveCssVar(path, project),
    token: token as RealisedToken<'fontFamily'>,
  }));
}

export interface FontFamilyPreviewViewProps {
  rows: FontFamilyRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  sample: string;
  /** Forwarded to each row's `FontFamilySpecimen` (uniform presenter contract; unused for fontFamily). */
  colorFormat: ColorFormat;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the font-family preview. Renders from plain props;
 * composes the connected `FontFamilySpecimen` as a child, feeding it this
 * row's already-resolved `token`/`cssVar` per the presenter contract.
 */
export function FontFamilyPreviewView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  sample,
  colorFormat,
  filter,
  caption,
}: FontFamilyPreviewViewProps): ReactElement {
  const Specimen = usePresenter('fontFamily');
  const captionText =
    caption ??
    `${rows.length} fontFamily token${rows.length === 1 ? '' : 's'}${filter && filter !== 'fontFamily' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No fontFamily tokens match this filter.</div>
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

export function FontFamilyPreview({
  filter,
  sample = 'The quick brown fox jumps over the lazy dog.',
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: FontFamilyPreviewProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const rows = useMemo(
    () => deriveFontFamilyRows(resolved, project, { filter, sortBy, sortDir }),
    [resolved, project, filter, sortBy, sortDir],
  );

  return (
    <FontFamilyPreviewView
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
