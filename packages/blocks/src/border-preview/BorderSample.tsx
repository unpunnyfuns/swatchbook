import type { CSSProperties, ReactElement } from 'react';
import { SURFACE_RAISED } from '#/internal/styles.tsx';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface BorderSampleProps {
  /** Full dot-path of the border token to preview. */
  path: string;
}

const sampleStyle: CSSProperties = {
  width: 120,
  height: 56,
  background: SURFACE_RAISED,
  borderRadius: 6,
};

export function BorderSample({ path }: BorderSampleProps): ReactElement {
  const project = useProject();
  const cssVar = resolveCssVar(path, project);
  return <div style={{ ...sampleStyle, border: cssVar }} aria-hidden />;
}
