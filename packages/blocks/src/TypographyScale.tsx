import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import type { RealisedToken } from '#/internal/composite-types.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { usePresenter } from '#/presenters/registry.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';

export interface TypographyScaleProps {
  /**
   * Token-path filter. Defaults to every `typography` token. Use e.g.
   * `"typography.*"` to scope to the semantic layer.
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

export interface TypographyRow {
  path: string;
  cssVar: string;
  /** Realised token, fed to `TypeSpecimen` per the presenter contract. */
  token: RealisedToken<'typography'>;
}

export interface DeriveTypographyRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
}

/**
 * Pure derivation of the scale's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveTypographyRows(
  resolved: ProjectData['resolved'],
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
  { filter, sortBy, sortDir }: DeriveTypographyRowsOptions,
): TypographyRow[] {
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'typography') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
    path,
    cssVar: resolveCssVar(path, project),
    token: token as RealisedToken<'typography'>,
  }));
}

export interface TypographyScaleViewProps {
  rows: TypographyRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  sample: string;
  /** Forwarded to each row's `TypeSpecimen` (uniform presenter contract; unused for typography). */
  colorFormat: ColorFormat;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the typography scale. Renders from plain props;
 * composes the connected `TypeSpecimen` as a child, feeding it this row's
 * already-resolved `token`/`cssVar` per the presenter contract.
 */
export function TypographyScaleView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  sample,
  colorFormat,
  filter,
  caption,
}: TypographyScaleViewProps): ReactElement {
  const Specimen = usePresenter('typography');
  const captionText =
    caption ??
    `${rows.length} typography token${rows.length === 1 ? '' : 's'}${filter && filter !== 'typography' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No typography tokens match this filter.</div>
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

export function TypographyScale({
  filter,
  sample = 'The quick brown fox jumps over the lazy dog.',
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: TypographyScaleProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const rows = useMemo(
    () => deriveTypographyRows(resolved, project, { filter, sortBy, sortDir }),
    [resolved, project, filter, sortBy, sortDir],
  );

  return (
    <TypographyScaleView
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
