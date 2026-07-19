import type { ReactElement } from 'react';
import { useMemo } from 'react';
import './BorderPreview.css';
import { useColorFormat } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import { formatDimension, formatSubColor } from '#/internal/composite-sample-format.ts';
import type { BorderValue, RealisedToken } from '#/internal/composite-types.ts';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { sortTokens } from '#/internal/sort-tokens.ts';
import type { SortBy, SortDir } from '#/internal/sort-tokens.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { usePresenter } from '#/presenters/registry.ts';
import { matchPath } from '@unpunnyfuns/swatchbook-core/match-path';

export interface BorderPreviewProps {
  /**
   * Token-path filter. Defaults to every `border` token. Use e.g.
   * `"border.*"` to scope to the semantic layer.
   */
  filter?: string;
  /** Override the caption. */
  caption?: string;
  /**
   * Sort order. `'path'` (default) sorts lexicographically on the
   * dot-path; `'value'` falls through to path (borders don't have a
   * single-axis ordering); `'none'` preserves project order.
   */
  sortBy?: SortBy;
  /** `'asc'` (default) or `'desc'`. */
  sortDir?: SortDir;
  /**
   * Highest-precedence color format for this preview's values, overriding
   * an outer `ColorFormatContext` and the project's `defaultColorFormat`.
   * Omit to inherit the existing precedence chain (see `useColorFormat`).
   */
  colorFormat?: ColorFormat;
}

export interface BorderRow {
  path: string;
  cssVar: string;
  /** Realised token, fed to `BorderSample` per the presenter contract. */
  token: RealisedToken<'border'>;
  width: string;
  style: string;
  color: string;
}

export interface DeriveBorderRowsOptions {
  filter?: string | undefined;
  sortBy: SortBy;
  sortDir: SortDir;
  colorFormat: ColorFormat;
}

/**
 * Pure derivation of the preview's display rows from resolved project data.
 * Extracted so it is unit-testable without React or a store.
 */
export function deriveBorderRows(
  resolved: ProjectData['resolved'],
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
  { filter, sortBy, sortDir, colorFormat }: DeriveBorderRowsOptions,
): BorderRow[] {
  const filtered = Object.entries(resolved).filter(([path, token]) => {
    if (token.$type !== 'border') return false;
    return matchPath(path, filter);
  });
  return sortTokens(filtered, { by: sortBy, dir: sortDir }).map(([path, token]) => {
    const value = (token.$value ?? {}) as BorderValue;
    return {
      path,
      cssVar: resolveCssVar(path, project),
      token: token as RealisedToken<'border'>,
      width: formatDimension(value.width),
      style: value.style != null ? String(value.style) : '—',
      color: formatSubColor(value.color, colorFormat),
    };
  });
}

export interface BorderPreviewViewProps {
  rows: BorderRow[];
  activeTheme: string;
  cssVarPrefix: string;
  activeAxes: Record<string, string>;
  /** Forwarded to each row's `BorderSample` for its realised-CSS branch. */
  colorFormat: ColorFormat;
  filter?: string | undefined;
  caption?: string | undefined;
}

/**
 * Pure presentation for the border preview. Renders from plain props;
 * composes the connected `BorderSample` as a child, feeding it this row's
 * already-resolved `token`/`cssVar` per the presenter contract.
 */
export function BorderPreviewView({
  rows,
  activeTheme,
  cssVarPrefix,
  activeAxes,
  colorFormat,
  filter,
  caption,
}: BorderPreviewViewProps): ReactElement {
  const Sample = usePresenter('border');
  const captionText =
    caption ??
    `${rows.length} border${rows.length === 1 ? '' : 's'}${filter ? ` matching \`${filter}\`` : ''} · ${activeTheme}`;

  if (rows.length === 0) {
    return (
      <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
        <div className="sb-block__empty">No border tokens match this filter.</div>
      </div>
    );
  }

  return (
    <div {...blockWrapperAttrs(cssVarPrefix, activeAxes)}>
      <div className="sb-block__caption">{captionText}</div>
      {rows.map((row) => (
        <div key={row.path} className="sb-border-preview__row">
          <div className="sb-border-preview__meta">
            <span className="sb-border-preview__path">{row.path}</span>
            <span className="sb-border-preview__css-var">{row.cssVar}</span>
          </div>
          <div className="sb-border-preview__sample-cell">
            {Sample && (
              <Sample
                path={row.path}
                token={row.token}
                cssVar={row.cssVar}
                colorFormat={colorFormat}
              />
            )}
          </div>
          <div className="sb-border-preview__breakdown">
            <span className="sb-border-preview__breakdown-key">width</span>
            <span>{row.width}</span>
            <span className="sb-border-preview__breakdown-key">style</span>
            <span>{row.style}</span>
            <span className="sb-border-preview__breakdown-key">color</span>
            <span>{row.color}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BorderPreview({
  filter,
  caption,
  sortBy = 'path',
  sortDir = 'asc',
  colorFormat,
}: BorderPreviewProps): ReactElement {
  const project = useProject();
  const { resolved, activeTheme, activeAxes, cssVarPrefix } = project;
  const contextColorFormat = useColorFormat();
  const format = colorFormat ?? contextColorFormat;

  const rows = useMemo(
    () =>
      deriveBorderRows(resolved, project, {
        filter,
        sortBy,
        sortDir,
        colorFormat: format,
      }),
    [resolved, project, filter, sortBy, sortDir, format],
  );

  return (
    <BorderPreviewView
      rows={rows}
      activeTheme={activeTheme}
      cssVarPrefix={cssVarPrefix}
      activeAxes={activeAxes}
      colorFormat={format}
      filter={filter}
      caption={caption}
    />
  );
}
