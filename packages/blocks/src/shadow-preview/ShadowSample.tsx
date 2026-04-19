import type { CSSProperties, ReactElement } from 'react';
import { chromeAliases } from '#/internal/data-attr.ts';
import { makeCssVar, useProject } from '#/internal/use-project.ts';

export interface ShadowSampleProps {
  /** Full dot-path of the shadow token to preview. */
  path: string;
}

const sampleStyle: CSSProperties = {
  width: 120,
  height: 56,
  background: 'var(--sb-color-sys-surface-raised, #fff)',
  border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))',
  borderRadius: 6,
};

export function ShadowSample({ path }: ShadowSampleProps): ReactElement {
  const { cssVarPrefix } = useProject();
  const cssVar = makeCssVar(path, cssVarPrefix);
  return (
    <div
      style={{ ...chromeAliases(cssVarPrefix), ...sampleStyle, boxShadow: cssVar }}
      aria-hidden
    />
  );
}
