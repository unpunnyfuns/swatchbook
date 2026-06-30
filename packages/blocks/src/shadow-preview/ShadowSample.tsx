import type { ReactElement } from 'react';
import './ShadowSample.css';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface ShadowSampleProps {
  /** Full dot-path of the shadow token to preview. */
  path: string;
}

export function ShadowSample({ path }: ShadowSampleProps): ReactElement {
  const project = useProject();
  const cssVar = resolveCssVar(path, project);
  return <div className="sb-shadow-sample" style={{ boxShadow: cssVar }} aria-hidden />;
}
