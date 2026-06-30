import type { ReactElement } from 'react';
import './BorderSample.css';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface BorderSampleProps {
  /** Full dot-path of the border token to preview. */
  path: string;
}

export function BorderSample({ path }: BorderSampleProps): ReactElement {
  const project = useProject();
  const cssVar = resolveCssVar(path, project);
  return <div className="sb-border-sample" style={{ border: cssVar }} aria-hidden />;
}
