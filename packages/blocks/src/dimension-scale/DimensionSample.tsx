import type { ReactElement } from 'react';
import './DimensionSample.css';
import { MAX_RENDER_PX, toPixels } from '#/dimension-scale/dimension-px.ts';
import { formatTokenValue } from '@unpunnyfuns/swatchbook-core/token-value-css';
import { useRootFontSize } from '#/internal/use-root-font-size.ts';
import type { PresenterProps } from '#/presenters/types.ts';

/** The visual treatment for a dimension sample: a length bar, a radius square, or a sized square. */
export type DimensionVisual = 'length' | 'radius' | 'size';

/** Props for the connected {@link DimensionSample} block. `options.visual` selects the visualization kind (see {@link DimensionVisual}); defaults to `'length'`. */
export type DimensionSampleProps = PresenterProps<'dimension'>;

// A consumer-supplied `options.visual` is untyped at the call site; an
// unrecognized value (or a non-string) falls back to 'length' rather than
// propagating a bogus visual into the switch below.
function asDimensionVisual(raw: unknown): DimensionVisual {
  return raw === 'length' || raw === 'radius' || raw === 'size' ? raw : 'length';
}

export interface DimensionSampleData {
  /** CSS var reference, or the realised `$value` as a `px`/`rem` literal. */
  cssVar: string;
  /** The resolved value in pixels, for cap comparison against {@link MAX_RENDER_PX}. `NaN` for non-`px`/`rem` units. */
  pxValue: number;
  /** Whether the resolved px exceeds {@link MAX_RENDER_PX}. */
  capped: boolean;
  /** The style value to render: `cssVar`, or the capped px literal when `capped`. */
  cappedValue: string;
}

/**
 * Pure derivation of a single dimension token's sample geometry from its
 * realised `$value`. The cap decision always reads the numeric `$value` (so
 * it holds regardless of whether `cssVar` is present); `cssVar`, when given,
 * wins as the rendered value up to that cap.
 */
export function deriveDimensionSample(
  props: Pick<PresenterProps<'dimension'>, 'token' | 'cssVar' | 'colorFormat'>,
  rootFontSizePx: number,
): DimensionSampleData {
  const realised = formatTokenValue(props.token.$value, 'dimension', props.colorFormat);
  const cssVar = props.cssVar ?? realised;
  const pxValue = toPixels(props.token.$value, rootFontSizePx);
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
      className="sb-dimension-sample sb-dimension-sample--capped"
      title={`capped at ${MAX_RENDER_PX}px`}
    >
      {visual}
      <span className="sb-dimension-sample__cap" aria-hidden>
        …
      </span>
    </span>
  );
}

/** Props for the pure {@link DimensionSampleView} presenter, derived from the resolved sample data. */
export type DimensionSampleViewProps = Pick<
  DimensionSampleData,
  'cssVar' | 'capped' | 'cappedValue'
> & {
  visual: DimensionVisual;
};

/** Pure presentation for a single dimension token's bar/sample. Renders from plain props. */
export function DimensionSampleView({
  cssVar,
  capped,
  cappedValue,
  visual,
}: DimensionSampleViewProps): ReactElement {
  switch (visual) {
    // A fixed 56×56 box: border-radius can't overflow it, so the cap never
    // applies to the radius sample.
    case 'radius':
      return (
        <div
          className="sb-dimension-sample__radius-sample"
          style={{ borderRadius: cssVar }}
          aria-hidden
        />
      );
    case 'size': {
      const sample = (
        <div
          className="sb-dimension-sample__size-sample"
          style={{ width: cappedValue, height: cappedValue }}
          aria-hidden
        />
      );
      return capped ? withCap(sample) : sample;
    }
    case 'length':
    default: {
      const bar = (
        <div className="sb-dimension-sample__bar" style={{ width: cappedValue }} aria-hidden />
      );
      return capped ? withCap(bar) : bar;
    }
  }
}

/** Connected block: renders a realised dimension token's sample, capped for oversized values. */
export function DimensionSample({
  token,
  cssVar,
  colorFormat,
  options,
}: DimensionSampleProps): ReactElement {
  const visual = asDimensionVisual(options?.['visual']);
  const rootFontSize = useRootFontSize();
  const derived = deriveDimensionSample({ token, cssVar, colorFormat }, rootFontSize);
  return (
    <DimensionSampleView
      cssVar={derived.cssVar}
      capped={derived.capped}
      cappedValue={derived.cappedValue}
      visual={visual}
    />
  );
}
