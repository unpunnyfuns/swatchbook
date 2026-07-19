import type { ReactElement } from 'react';
import './BorderSample.css';
import type { ColorFormat } from '#/format-color.ts';
import { formatColor } from '#/format-color.ts';
import type { BorderValue } from '#/internal/composite-types.ts';
import { cssColorFormat, formatLength } from '#/internal/value-to-css.ts';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the connected {@link BorderSample} block. */
export type BorderSampleProps = PresenterProps<'border'>;

export interface BorderSampleData {
  /** CSS var reference for the token's border, or the realised `border` text. */
  cssVar: string;
}

export type BorderSampleViewProps = BorderSampleData;

/** Pure presentation for a single border token's sample. Renders from plain props. */
export function BorderSampleView({ cssVar }: BorderSampleViewProps): ReactElement {
  return <div className="sb-border-sample" style={{ border: cssVar }} aria-hidden />;
}

/**
 * Builds a valid `border` shorthand value straight from a realised
 * `border.$value`. Distinct from core's `formatTokenValue`, whose `raw`
 * color branch emits a display-only JSON string that the browser would
 * reject as a border color.
 */
function borderValueToCss(value: unknown, colorFormat: ColorFormat): string {
  if (!value || typeof value !== 'object') return '';
  const b = value as BorderValue;
  const width = formatLength(b.width);
  const style = typeof b.style === 'string' ? b.style : 'solid';
  const color = formatColor(b.color, cssColorFormat(colorFormat)).value;
  return [width, style, color].join(' ');
}

export function BorderSample({ token, cssVar, colorFormat }: BorderSampleProps): ReactElement {
  const visual = cssVar ?? borderValueToCss(token.$value, colorFormat);
  return <BorderSampleView cssVar={visual} />;
}
