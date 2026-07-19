import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './StrokeStylePreview.css';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import type { RealisedToken } from '#/internal/composite-types.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { usePresenter } from '#/presenters/registry.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

export interface StrokeStylePreviewProps {
  /**
   * Token-path filter. Defaults to every `strokeStyle` token. Use e.g.
   * `"stroke.style.*"` to scope to the ref layer.
   */
  filter?: string;
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

export interface StrokeStyleRow {
  path: string;
  cssVar: string;
  displayValue: string;
  /** Realised token, fed to `StrokeSample` per the presenter contract. */
  token: RealisedToken<'strokeStyle'>;
}

export interface DeriveStrokeStyleRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
}

/**
 * Pure derivation of the preview's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveStrokeStyleRows(
  resolved: ProjectData['resolved'],
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
  { filter, sortBy, sortDir }: DeriveStrokeStyleRowsOptions,
): StrokeStyleRow[] {
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'strokeStyle') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => ({
    path,
    cssVar: resolveCssVar(path, project),
    displayValue: formatTokenValue(token.$value, token.$type, 'raw', project.listing[path]),
    token: token as RealisedToken<'strokeStyle'>,
  }));
}

export interface StrokeStylePreviewViewProps {
  rows: StrokeStyleRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  /** Forwarded to each row's `StrokeSample` (uniform presenter contract; unused for strokeStyle). */
  colorFormat: ColorFormat;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the stroke-style preview. Renders from plain props;
 * composes the connected `StrokeSample` as a child, feeding it this row's
 * already-resolved `token`/`cssVar` per the presenter contract.
 */
export function StrokeStylePreviewView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  colorFormat,
  filter,
  caption,
}: StrokeStylePreviewViewProps): ReactElement {
  const Sample = usePresenter('strokeStyle');
  const captionText =
    caption ??
    `${rows.length} strokeStyle token${rows.length === 1 ? '' : 's'}${filter && filter !== 'strokeStyle' ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No strokeStyle tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-stroke-style-sample__row">
          <div className="sb-stroke-style-sample__meta">
            <span className="sb-stroke-style-sample__path">{row.path}</span>
            <span className="sb-stroke-style-sample__value">{row.displayValue}</span>
          </div>
          {Sample && (
            <Sample
              path={row.path}
              token={row.token}
              cssVar={row.cssVar}
              colorFormat={colorFormat}
            />
          )}
          <span className="sb-stroke-style-sample__css-var">{row.cssVar}</span>
        </div>
      ))}
    </div>
  );
}

export function StrokeStylePreview({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
}: StrokeStylePreviewProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = project;
  const colorFormat = useColorFormat();

  const rows = useMemo(
    () => deriveStrokeStyleRows(resolved, project, { filter, sortBy, sortDir }),
    [resolved, project, filter, sortBy, sortDir],
  );

  return (
    <StrokeStylePreviewView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      colorFormat={colorFormat}
      filter={filter}
      caption={caption}
    />
  );
}
