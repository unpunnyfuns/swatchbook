import type { ReactElement } from 'react';
import type { GradientStop } from '@unpunnyfuns/swatchbook-core/token-value-types';
import './GradientSwatch.css';
import type { ColorFormat } from '#/format-color.ts';
import { formatColor } from '#/format-color.ts';
import { cssColorFormat } from '#/internal/value-to-css.ts';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the {@link GradientSwatch} presenter. */
export type GradientSwatchProps = PresenterProps<'gradient'>;

/**
 * Builds a valid `linear-gradient()` value straight from a realised
 * `gradient.$value` stop list. Distinct from core's `formatTokenValue`,
 * whose `raw` color branch emits a display-only JSON string per stop that
 * the browser would reject as a gradient color.
 */
function gradientValueToCss(stops: readonly GradientStop[], colorFormat: ColorFormat): string {
  const format = cssColorFormat(colorFormat);
  const stopsCss = stops
    .map((stop) => {
      const color = formatColor(stop.color, format).value;
      const position = typeof stop.position === 'number' ? stop.position : 0;
      return `${color} ${(position * 100).toFixed(0)}%`;
    })
    .join(', ');
  return `linear-gradient(90deg, ${stopsCss})`;
}

/**
 * Presenter for `$type: gradient` tokens: a gradient chip. Unlike the
 * other composite presenters, a gradient's css var (per Terrazzo's
 * `transformGradient`) resolves to a bare `<color> <pct>, ...` stop list,
 * not a complete property value: DTCG gradients carry no direction, so
 * both branches need one supplied at render time. `90deg` (`to right`)
 * matches the direction the standalone block previously hard-coded.
 */
export function GradientSwatch({ token, cssVar, colorFormat }: GradientSwatchProps): ReactElement {
  const stops = Array.isArray(token.$value) ? (token.$value as GradientStop[]) : [];
  const background = cssVar
    ? `linear-gradient(90deg, ${cssVar})`
    : gradientValueToCss(stops, colorFormat);
  return <div className="sb-gradient-swatch__chip" style={{ background }} aria-hidden />;
}
