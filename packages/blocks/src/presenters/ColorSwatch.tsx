import type { ReactElement } from 'react';
import './ColorSwatch.css';
import { formatColor } from '#/format-color.ts';
import { cssColorFormat } from '#/internal/value-to-css.ts';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the {@link ColorSwatch} presenter. */
export type ColorSwatchProps = PresenterProps<'color'>;

// Last dot-segment of a token path, used as the swatch's leaf label.
function leafOf(path: string): string {
  return path.split('.').at(-1) ?? path;
}

/**
 * Presenter for `$type: color` tokens: a color chip, leaf label, and
 * formatted value with an out-of-gamut marker. The chip's background is
 * `cssVar` when supplied (R3); otherwise it is computed straight from
 * `token.$value`, with `raw` guarded to `hex` (`cssColorFormat`) so the chip
 * always paints a real color even when the display format is a JSON debug
 * string. The value text below the chip uses the actual `colorFormat`,
 * `raw` included.
 */
export function ColorSwatch({ path, token, cssVar, colorFormat }: ColorSwatchProps): ReactElement {
  const chipBackground = cssVar ?? formatColor(token.$value, cssColorFormat(colorFormat)).value;
  const { value, outOfGamut } = formatColor(token.$value, colorFormat);
  return (
    <div className="sb-color-swatch">
      <div className="sb-color-swatch__chip" style={{ background: chipBackground }} aria-hidden />
      <div className="sb-color-swatch__meta">
        <span className="sb-color-swatch__leaf">{leafOf(path)}</span>
        <span className="sb-color-swatch__value">
          {value}
          {outOfGamut && (
            <span
              title="Out of sRGB gamut for this format"
              aria-label="out of gamut"
              className="sb-color-swatch__gamut-warn"
            >
              {' '}
              ⚠
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
