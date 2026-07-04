import type { ReactElement } from 'react';
import './ShadowSample.css';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';

export interface ShadowSampleProps {
  /** Full dot-path of the shadow token to preview. */
  path: string;
}

export interface ShadowSampleData {
  /** CSS var reference for the token's shadow (listing name, or prefix fallback). */
  cssVar: string;
}

/**
 * Pure derivation of a single shadow token's sample data from resolved
 * project data. Extracted so it is unit-testable without React or a store.
 */
export function deriveShadowSample(
  path: string,
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
): ShadowSampleData {
  return { cssVar: resolveCssVar(path, project) };
}

export type ShadowSampleViewProps = ShadowSampleData;

/** Pure presentation for a single shadow token's sample. Renders from plain props. */
export function ShadowSampleView({ cssVar }: ShadowSampleViewProps): ReactElement {
  return <div className="sb-shadow-sample" style={{ boxShadow: cssVar }} aria-hidden />;
}

export function ShadowSample({ path }: ShadowSampleProps): ReactElement {
  const project = useProject();
  const { cssVar } = deriveShadowSample(path, project);
  return <ShadowSampleView cssVar={cssVar} />;
}
