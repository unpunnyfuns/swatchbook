import type { CSSProperties, ReactElement } from 'react';
import { BORDER_FAINT, SURFACE_RAISED } from '#/internal/styles.tsx';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';

export interface ShadowSampleProps {
  /** Full dot-path of the shadow token to preview. */
  path: string;
}

const sampleStyle: CSSProperties = {
  width: 120,
  height: 56,
  background: SURFACE_RAISED,
  border: BORDER_FAINT,
  borderRadius: 6,
};

export function ShadowSample({ path }: ShadowSampleProps): ReactElement {
  const project = useProject();
  const cssVar = resolveCssVar(path, project);
  return <div style={{ ...sampleStyle, boxShadow: cssVar }} aria-hidden />;
}
