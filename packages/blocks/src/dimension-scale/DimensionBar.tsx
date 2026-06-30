import type { ReactElement } from 'react';
import './DimensionBar.css';
import { MAX_RENDER_PX, toPixels } from '#/dimension-scale/dimension-px.ts';
import { useRootFontSize } from '#/internal/use-root-font-size.ts';
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

// Wrap a clamped visual with the cap affordance so every consumer (the scale
// block and TokenNavigator) surfaces truncation identically. The visual itself
// is decorative — the token's real value is shown as adjacent text — so the
// marker is aria-hidden and the title carries the hint for sighted hover.
function withCap(visual: ReactElement): ReactElement {
  return (
    <span
      className="sb-dimension-bar sb-dimension-bar--capped"
      title={`capped at ${MAX_RENDER_PX}px`}
    >
      {visual}
      <span className="sb-dimension-bar__cap" aria-hidden>
        …
      </span>
    </span>
  );
}

export function DimensionBar({ path, visual = 'length' }: DimensionBarProps): ReactElement {
  const project = useProject();
  const { resolved } = project;
  const rootFontSize = useRootFontSize();
  const cssVar = resolveCssVar(path, project);
  const token = resolved[path];
  const pxValue = toPixels(token?.$value, rootFontSize);
  const capped = Number.isFinite(pxValue) && pxValue > MAX_RENDER_PX;
  const cappedValue = capped ? `${MAX_RENDER_PX}px` : cssVar;

  switch (visual) {
    // A fixed 56×56 box: border-radius can't overflow it, so the cap never
    // applies to the radius sample.
    case 'radius':
      return (
        <div
          className="sb-dimension-bar__radius-sample"
          style={{ borderRadius: cssVar }}
          aria-hidden
        />
      );
    case 'size': {
      const sample = (
        <div
          className="sb-dimension-bar__size-sample"
          style={{ width: cappedValue, height: cappedValue }}
          aria-hidden
        />
      );
      return capped ? withCap(sample) : sample;
    }
    case 'length':
    default: {
      const bar = (
        <div className="sb-dimension-bar__bar" style={{ width: cappedValue }} aria-hidden />
      );
      return capped ? withCap(bar) : bar;
    }
  }
}
