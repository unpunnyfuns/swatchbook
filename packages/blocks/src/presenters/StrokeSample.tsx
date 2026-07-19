import type { CSSProperties, ReactElement } from 'react';
import './StrokeSample.css';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the {@link StrokeSample} presenter. */
export type StrokeSampleProps = PresenterProps<'strokeStyle'>;

const STRING_STYLES = new Set([
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'outset',
  'inset',
]);

// The object dash-pattern form (`{ dashArray?, lineCap? }`) has no pure CSS
// `border-style` equivalent; only the literal string keywords map directly.
// Independent of `cssVar`: a resolved var for an unrepresentable value isn't
// a border-style either, so the fallback message wins regardless.
function isCssStyleKeyword(value: unknown): value is string {
  return typeof value === 'string' && STRING_STYLES.has(value);
}

export interface StrokeSampleViewProps {
  /** CSS var reference for the stroke style, or the realised keyword; `null` for the dash-object form. */
  cssStyle: string | null;
}

/** Pure presentation for a single stroke-style token's line. Renders from plain props. */
export function StrokeSampleView({ cssStyle }: StrokeSampleViewProps): ReactElement {
  if (!cssStyle) {
    return (
      <span className="sb-stroke-sample__object-fallback">
        Object-form (dashArray + lineCap) — no pure CSS `border-style` equivalent.
      </span>
    );
  }
  return (
    <div
      className="sb-stroke-sample__line"
      style={{ borderTopStyle: cssStyle as CSSProperties['borderTopStyle'] }}
      aria-hidden
    />
  );
}

/**
 * Presenter for `$type: strokeStyle` tokens: a line styled with the
 * token's `border-top-style` per R3, or the object-form fallback message
 * when `$value` is a dash pattern with no pure CSS equivalent.
 */
export function StrokeSample({ token, cssVar }: StrokeSampleProps): ReactElement {
  const cssStyle = isCssStyleKeyword(token.$value) ? (cssVar ?? token.$value) : null;
  return <StrokeSampleView cssStyle={cssStyle} />;
}
