import type { ReactElement } from 'react';
import './DimensionBar.css';
import { MAX_RENDER_PX, toPixels } from '#/dimension-scale/dimension-px.ts';
import { useRootFontSize } from '#/internal/use-root-font-size.ts';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';

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

export interface DimensionBarData {
  /** CSS var reference for the token's dimension (listing name, or prefix fallback). */
  cssVar: string;
  /** The resolved value in pixels, for cap comparison against {@link MAX_RENDER_PX}. `NaN` for non-`px`/`rem` units. */
  pxValue: number;
  /** Whether the resolved px exceeds {@link MAX_RENDER_PX}. */
  capped: boolean;
  /** The style value to render: `cssVar`, or the capped px literal when `capped`. */
  cappedValue: string;
}

/**
 * Pure derivation of a single dimension token's bar geometry from resolved
 * project data. Extracted so it is unit-testable without React or a store.
 */
export function deriveDimensionBar(
  path: string,
  project: Pick<ProjectData, 'resolved' | 'listing' | 'cssVarPrefix'>,
  rootFontSizePx: number,
): DimensionBarData {
  const cssVar = resolveCssVar(path, project);
  const token = project.resolved[path];
  const pxValue = toPixels(token?.$value, rootFontSizePx);
  const capped = Number.isFinite(pxValue) && pxValue > MAX_RENDER_PX;
  const cappedValue = capped ? `${MAX_RENDER_PX}px` : cssVar;
  return { cssVar, pxValue, capped, cappedValue };
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

export type DimensionBarViewProps = Pick<DimensionBarData, 'cssVar' | 'capped' | 'cappedValue'> & {
  visual: DimensionVisual;
};

/** Pure presentation for a single dimension token's bar/sample. Renders from plain props. */
export function DimensionBarView({
  cssVar,
  capped,
  cappedValue,
  visual,
}: DimensionBarViewProps): ReactElement {
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

export function DimensionBar({ path, visual = 'length' }: DimensionBarProps): ReactElement {
  const project = useProject();
  const rootFontSize = useRootFontSize();
  const { cssVar, capped, cappedValue } = deriveDimensionBar(path, project, rootFontSize);
  return (
    <DimensionBarView cssVar={cssVar} capped={capped} cappedValue={cappedValue} visual={visual} />
  );
}
