import type { ReactElement } from 'react';
import './ShadowSample.css';
import type { ColorFormat } from '#/format-color.ts';
import { formatColor } from '#/format-color.ts';
import type { ShadowLayer } from '#/internal/composite-types.ts';
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

function formatLength(raw: unknown): string {
  if (typeof raw === 'number') return `${raw}px`;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const v = raw as { value?: unknown; unit?: unknown };
    if (typeof v.value === 'number' && typeof v.unit === 'string') return `${v.value}${v.unit}`;
  }
  return '0px';
}

// `raw` colorFormat renders a JSON debug string (core's `formatColor`), which
// isn't a valid CSS color — fall back to hex only for that one format so the
// swatch still paints; every other format (rgb/hsl/oklch/hex) is valid CSS.
function cssColorFormat(format: ColorFormat): Exclude<ColorFormat, 'raw'> {
  return format === 'raw' ? 'hex' : format;
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
