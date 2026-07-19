import type { CSSProperties, ReactElement } from 'react';
import './TypeSpecimen.css';
import type { TypographyValue } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { formatLength } from '#/internal/value-to-css.ts';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the connected {@link TypeSpecimen} block. `options.sample` overrides the rendered sample text; defaults to a pangram. */
export type TypeSpecimenProps = PresenterProps<'typography'>;

const DEFAULT_SAMPLE = 'The quick brown fox jumps over the lazy dog.';

// Last dot-segment of a token path, used as the specimen's leaf label.
function leafOf(path: string): string {
  return path.split('.').at(-1) ?? path;
}

function asFontFamily(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  return undefined;
}

/**
 * Builds the sample's inline style straight from a realised
 * `typography.$value`. `fontSize`/`letterSpacing` share `formatLength` with
 * the border/shadow presenters (same DTCG `{ value, unit }` dimension
 * envelope); `fontWeight`/`lineHeight` are unitless and cast to strings
 * directly.
 */
function styleFromValue(value: TypographyValue): CSSProperties {
  const style: CSSProperties = {};
  const fontFamily = asFontFamily(value.fontFamily);
  if (fontFamily) style.fontFamily = fontFamily;
  if (value.fontSize != null) style.fontSize = formatLength(value.fontSize);
  if (value.fontWeight != null) {
    style.fontWeight = String(value.fontWeight) as CSSProperties['fontWeight'];
  }
  if (value.lineHeight != null) style.lineHeight = String(value.lineHeight);
  if (value.letterSpacing != null) style.letterSpacing = formatLength(value.letterSpacing);
  return style;
}

// Compact spec summary shown under the leaf label when the token has no
// $description: size, weight, and line-height are the dimensions a reader
// scans a type scale for.
function describeValue(value: TypographyValue): string {
  const fontSize = value.fontSize != null ? formatLength(value.fontSize) : undefined;
  const fontWeight = value.fontWeight != null ? `w${String(value.fontWeight)}` : undefined;
  const lineHeight = value.lineHeight != null ? `lh ${String(value.lineHeight)}` : undefined;
  return [fontSize, fontWeight, lineHeight].filter(Boolean).join(' · ');
}

/**
 * Presenter for `$type: typography` tokens: a leaf label, spec summary, and
 * a sample line styled per R3. Terrazzo's `generateShorthand` assigns a
 * typography token's base css var the CSS `font` shorthand value (style,
 * weight, size/line-height, family, each a per-subvalue `var()`), so
 * `cssVar` applies directly to the sample's `font` property. That
 * shorthand's grammar has no slot for `letter-spacing`, so the cssVar
 * branch renders without it; the realised branch below applies every field
 * the token carries, `letterSpacing` included.
 */
export function TypeSpecimen({ path, token, cssVar, options }: TypeSpecimenProps): ReactElement {
  const sample = (options?.['sample'] as string | undefined) ?? DEFAULT_SAMPLE;
  const value = (token.$value ?? {}) as TypographyValue;
  const sampleStyle: CSSProperties = cssVar ? { font: cssVar } : styleFromValue(value);
  const description = token.$description ?? describeValue(value);
  return (
    <div className="sb-type-specimen">
      <div className="sb-type-specimen__meta">
        <span className="sb-type-specimen__leaf">{leafOf(path)}</span>
        {description && <span className="sb-type-specimen__description">{description}</span>}
      </div>
      <div className="sb-type-specimen__sample" style={sampleStyle}>
        {sample}
      </div>
    </div>
  );
}
