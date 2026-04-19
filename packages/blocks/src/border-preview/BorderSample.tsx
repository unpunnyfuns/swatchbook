import type { CSSProperties, ReactElement } from 'react';
import { chromeAliases } from '#/internal/data-attr.ts';
import { makeCssVar, useProject } from '#/internal/use-project.ts';

export interface BorderSampleProps {
  /** Full dot-path of the border token to preview. */
  path: string;
}

const sampleStyle: CSSProperties = {
  width: 120,
  height: 56,
  background: 'var(--sb-color-sys-surface-raised, transparent)',
  borderRadius: 6,
};

export function BorderSample({ path }: BorderSampleProps): ReactElement {
  const { cssVarPrefix } = useProject();
  const cssVar = makeCssVar(path, cssVarPrefix);
  return (
    <div style={{ ...chromeAliases(cssVarPrefix), ...sampleStyle, border: cssVar }} aria-hidden />
  );
}
