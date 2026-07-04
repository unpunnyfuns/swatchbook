import type { ReactElement } from 'react';
import './BorderSample.css';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';

export interface BorderSampleProps {
  /** Full dot-path of the border token to preview. */
  path: string;
}

export interface BorderSampleData {
  /** CSS var reference for the token's border (listing name, or prefix fallback). */
  cssVar: string;
}

/**
 * Pure derivation of a single border token's sample data from resolved
 * project data. Extracted so it is unit-testable without React or a store.
 */
export function deriveBorderSample(
  path: string,
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
): BorderSampleData {
  return { cssVar: resolveCssVar(path, project) };
}

export type BorderSampleViewProps = BorderSampleData;

/** Pure presentation for a single border token's sample. Renders from plain props. */
export function BorderSampleView({ cssVar }: BorderSampleViewProps): ReactElement {
  return <div className="sb-border-sample" style={{ border: cssVar }} aria-hidden />;
}

export function BorderSample({ path }: BorderSampleProps): ReactElement {
  const project = useProject();
  const { cssVar } = deriveBorderSample(path, project);
  return <BorderSampleView cssVar={cssVar} />;
}
