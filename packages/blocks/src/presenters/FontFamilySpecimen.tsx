import type { CSSProperties, ReactElement } from 'react';
import './FontFamilySpecimen.css';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the {@link FontFamilySpecimen} presenter. `options.sample` overrides the rendered sample text; defaults to a pangram. */
export type FontFamilySpecimenProps = PresenterProps<'fontFamily'>;

const DEFAULT_SAMPLE = 'The quick brown fox jumps over the lazy dog.';

// A fontFamily $value is either a single font name or a stack; joins the
// array form the same way a CSS `font-family` list-value reads.
function stackString(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  return '';
}

/**
 * Presenter for `$type: fontFamily` tokens: path, resolved stack, a sample
 * line styled per R3, and the css var in use.
 */
export function FontFamilySpecimen({
  path,
  token,
  cssVar,
  options,
}: FontFamilySpecimenProps): ReactElement {
  const rawSample = options?.['sample'];
  const sample = typeof rawSample === 'string' ? rawSample : DEFAULT_SAMPLE;
  const stack = stackString(token.$value);
  const sampleStyle: CSSProperties = { fontFamily: cssVar ?? stack };
  return (
    <div className="sb-font-family-specimen__row">
      <div className="sb-font-family-specimen__meta">
        <span className="sb-font-family-specimen__path">{path}</span>
        <span className="sb-font-family-specimen__stack">{stack}</span>
      </div>
      <div className="sb-font-family-specimen__sample" style={sampleStyle}>
        {sample}
      </div>
      {cssVar && <span className="sb-font-family-specimen__css-var">{cssVar}</span>}
    </div>
  );
}
