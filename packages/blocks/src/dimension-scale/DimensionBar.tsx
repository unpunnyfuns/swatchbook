import type { CSSProperties, ReactElement } from 'react';
import { MAX_RENDER_PX, toPixels } from '#/dimension-scale/dimension-px.ts';
import { BORDER_STRONG } from '#/internal/styles.tsx';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';

export type DimensionVisual = 'length' | 'radius' | 'size';

export interface DimensionBarProps {
  /** Full dot-path of the dimension token to preview. */
  path: string;
  /**
   * Visualization kind:
   * - `'length'` (default): horizontal bar whose width equals the token's dimension.
   * - `'radius'`: 56×56 square with the token applied as `border-radius`.
   * - `'size'`: a square sized to the token's dimension.
   */
  visual?: DimensionVisual;
}

const styles = {
  bar: {
    height: 14,
    background: 'var(--swatchbook-accent-bg, #3b82f6)',
    borderRadius: 2,
    minWidth: 1,
  } satisfies CSSProperties,
  radiusSample: {
    width: 56,
    height: 56,
    background: 'var(--swatchbook-accent-bg, #3b82f6)',
    border: BORDER_STRONG,
  } satisfies CSSProperties,
  sizeSample: {
    background: 'var(--swatchbook-accent-bg, #3b82f6)',
    border: BORDER_STRONG,
    minWidth: 1,
    minHeight: 1,
  } satisfies CSSProperties,
};

export function DimensionBar({ path, visual = 'length' }: DimensionBarProps): ReactElement {
  const project = useProject();
  const { resolved } = project;
  const cssVar = resolveCssVar(path, project);
  const token = resolved[path];
  const pxValue = toPixels(token?.$value);
  const capped = Number.isFinite(pxValue) && pxValue > MAX_RENDER_PX;
  const cappedValue = capped ? `${MAX_RENDER_PX}px` : cssVar;

  switch (visual) {
    case 'radius':
      return <div style={{ ...styles.radiusSample, borderRadius: cssVar }} aria-hidden />;
    case 'size':
      return (
        <div
          style={{ ...styles.sizeSample, width: cappedValue, height: cappedValue }}
          aria-hidden
        />
      );
    case 'length':
    default:
      return <div style={{ ...styles.bar, width: cappedValue }} aria-hidden />;
  }
}
