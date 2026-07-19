import type { ReactElement } from 'react';
import './ShadowSample.css';
import type { ColorFormat } from '#/format-color.ts';
import { formatColor } from '#/format-color.ts';
import type { ShadowLayer } from '#/internal/composite-types.ts';
import { cssColorFormat, formatLength } from '#/internal/value-to-css.ts';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the connected {@link ShadowSample} block. */
export type ShadowSampleProps = PresenterProps<'shadow'>;

export interface ShadowSampleData {
  /** CSS var reference for the token's shadow, or the realised `box-shadow` text. */
  cssVar: string;
}

export type ShadowSampleViewProps = ShadowSampleData;

/** Pure presentation for a single shadow token's sample. Renders from plain props. */
export function ShadowSampleView({ cssVar }: ShadowSampleViewProps): ReactElement {
  return <div className="sb-shadow-sample" style={{ boxShadow: cssVar }} aria-hidden />;
}

/**
 * Builds a valid `box-shadow` value straight from a realised `shadow.$value`
 * (single layer or array). Distinct from core's `formatTokenValue`, whose
 * `raw` color branch emits a display-only JSON string that the browser
 * would reject as a box-shadow color.
 */
function shadowValueToCss(value: unknown, colorFormat: ColorFormat): string {
  const layers = Array.isArray(value) ? value : [value];
  const format = cssColorFormat(colorFormat);
  return layers
    .map((layer) => {
      if (!layer || typeof layer !== 'object') return '';
      const s = layer as ShadowLayer;
      const pieces = [
        formatLength(s.offsetX),
        formatLength(s.offsetY),
        formatLength(s.blur),
        formatLength(s.spread),
        formatColor(s.color, format).value,
      ];
      if (s.inset) pieces.push('inset');
      return pieces.join(' ');
    })
    .filter((layer) => layer !== '')
    .join(', ');
}

export function ShadowSample({ token, cssVar, colorFormat }: ShadowSampleProps): ReactElement {
  const visual = cssVar ?? shadowValueToCss(token.$value, colorFormat);
  return <ShadowSampleView cssVar={visual} />;
}
