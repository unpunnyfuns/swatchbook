import type { CSSProperties, ReactElement } from 'react';
import './FontWeightSpecimen.css';
import { cssVarAsNumber } from '#/internal/css-var-style.ts';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the {@link FontWeightSpecimen} presenter. `options.sample` overrides the rendered sample text; defaults to `'Aa'`. */
export type FontWeightSpecimenProps = PresenterProps<'fontWeight'>;

const DEFAULT_SAMPLE = 'Aa';

/**
 * Presenter for `$type: fontWeight` tokens: path, the raw weight value, a
 * sample glyph styled per R3, and the css var in use.
 */
export function FontWeightSpecimen({
  path,
  token,
  cssVar,
  options,
}: FontWeightSpecimenProps): ReactElement {
  const sample = (options?.['sample'] as string | undefined) ?? DEFAULT_SAMPLE;
  const display = token.$value == null ? '' : String(token.$value);
  const sampleStyle: CSSProperties = {
    fontWeight: cssVar ? cssVarAsNumber(cssVar) : (display as CSSProperties['fontWeight']),
  };
  return (
    <div className="sb-font-weight-specimen__row">
      <div className="sb-font-weight-specimen__meta">
        <span className="sb-font-weight-specimen__path">{path}</span>
        <span className="sb-font-weight-specimen__value">{display}</span>
      </div>
      <div className="sb-font-weight-specimen__sample" style={sampleStyle}>
        {sample}
      </div>
      {cssVar && <span className="sb-font-weight-specimen__css-var">{cssVar}</span>}
    </div>
  );
}
