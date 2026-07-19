import type { ReactElement } from 'react';
import './OpacitySwatch.css';
import type { PresenterProps } from '#/presenters/types.ts';

/**
 * Props for the {@link OpacitySwatch} presenter. `options.sampleColorVar`
 * sets the chip's fill color (a resolved css var or literal); defaults to
 * the swatchbook accent surface.
 */
export type OpacitySwatchProps = PresenterProps<'number'>;

const DEFAULT_SAMPLE_COLOR_VAR = 'var(--swatchbook-accent-bg)';

// A non-numeric $value (an opacity token whose value failed to resolve to a
// number) still renders a visible chip rather than a silently blank one.
function opacityValueToCss(value: unknown): string {
  return typeof value === 'number' ? String(value) : '1';
}

export interface OpacitySwatchViewProps {
  /** CSS var reference for the opacity, or the realised `$value` as a numeric string literal. */
  opacity: string;
  /** Color painted behind the checkerboard so the alpha reads visually. */
  sampleColorVar: string;
}

/** Pure presentation for a single opacity token's chip. Renders from plain props. */
export function OpacitySwatchView({
  opacity,
  sampleColorVar,
}: OpacitySwatchViewProps): ReactElement {
  return (
    <div className="sb-opacity-swatch">
      <div
        className="sb-opacity-swatch__chip"
        style={{ opacity, background: sampleColorVar }}
        aria-hidden
      />
    </div>
  );
}

/**
 * Presenter for `$type: number` opacity tokens: a colored chip over a
 * checkerboard backdrop, with the chip's `opacity` set from the token per
 * R3. The number alone (`0.4`) doesn't convey what the token looks like
 * applied to a surface; the chip does.
 */
export function OpacitySwatch({ token, cssVar, options }: OpacitySwatchProps): ReactElement {
  const opacity = cssVar ?? opacityValueToCss(token.$value);
  const sampleColorVar =
    (options?.['sampleColorVar'] as string | undefined) ?? DEFAULT_SAMPLE_COLOR_VAR;
  return <OpacitySwatchView opacity={opacity} sampleColorVar={sampleColorVar} />;
}
