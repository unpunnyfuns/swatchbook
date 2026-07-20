import type { CSSProperties, ReactElement } from 'react';
import './TypeSpecimen.css';
import type { TypographyValue } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { formatLength } from '#/internal/value-to-css.ts';
import type { PresenterProps } from '#/presenters/types.ts';

/** Props for the connected {@link TypeSpecimen} block. `options.sample` overrides the rendered sample text; defaults to a pangram. */
export type TypeSpecimenProps = PresenterProps<'typography'>;

const DEFAULT_SAMPLE = 'The quick brown fox jumps over the lazy dog.';

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

// Compact spec summary always shown above the sample: size, weight, and
// line-height are the dimensions a reader scans a type scale for, and no
// $description (which is prose, not a spec) may take its place.
function describeValue(value: TypographyValue): string {
  const fontSize = value.fontSize != null ? formatLength(value.fontSize) : undefined;
  const fontWeight = value.fontWeight != null ? `w${String(value.fontWeight)}` : undefined;
  const lineHeight = value.lineHeight != null ? `lh ${String(value.lineHeight)}` : undefined;
  return [fontSize, fontWeight, lineHeight].filter(Boolean).join(' · ');
}

/**
 * Presenter for `$type: typography` tokens: a spec summary and a sample line
 * styled per R3. Token identity (the path) is the consuming block's
 * responsibility, not this presenter's; see `TypographyScale`.
 */
export function TypeSpecimen({ token, cssVar: _cssVar, options }: TypeSpecimenProps): ReactElement {
  const rawSample = options?.['sample'];
  const sample = typeof rawSample === 'string' ? rawSample : DEFAULT_SAMPLE;
  const value = token.$value ?? {};
  // Terrazzo emits typography sub-properties (font-family/size/weight/
  // line-height) as individual custom properties, never a composite `font`
  // shorthand var. `font: var(--sb-typography-<name>)` references an
  // undefined variable, and the `font` shorthand is all-or-nothing, so the
  // whole declaration drops and the sample falls back to base size. Render
  // from the realised `$value` instead; it stays correct across axis flips
  // because the block re-resolves and re-renders.
  const sampleStyle: CSSProperties = styleFromValue(value);
  const specs = describeValue(value);
  return (
    <div className="sb-type-specimen">
      {specs && <span className="sb-type-specimen__description">{specs}</span>}
      <div className="sb-type-specimen__sample" style={sampleStyle}>
        {sample}
      </div>
    </div>
  );
}
