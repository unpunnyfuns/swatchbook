/**
 * Typed envelopes for DTCG 2025.10 composite `$value` shapes, one per
 * `$type` the packages that render tokens consume. `RealisedToken`'s
 * top-level `$value` is typed per `$type` via the `TokenValue<T>` mapped
 * type below; sub-values stay `unknown` because each may be a primitive
 * (number / string), a sub-value alias (string in `{token.path}` form,
 * post-resolution flattened to a string), or a nested composite. The win
 * over `Record<string, unknown>` isn't value-level narrowing: it's that
 * typo-ing a key (`fontFamlly`) becomes a compile error.
 *
 * The DTCG spec is the source of truth for the keys; this file
 * translates that into TypeScript without re-deriving the spec at
 * every consuming site.
 */

/**
 * `typography.$value` per DTCG 2025.10 §8.7. All fields optional —
 * partial specs are valid (e.g. a token may set only `fontSize` +
 * `lineHeight` and inherit the rest).
 */
export interface TypographyValue {
  fontFamily?: unknown;
  fontSize?: unknown;
  fontWeight?: unknown;
  lineHeight?: unknown;
  letterSpacing?: unknown;
}

/** `border.$value` per DTCG 2025.10 §8.4. */
export interface BorderValue {
  color?: unknown;
  width?: unknown;
  style?: unknown;
}

/** `transition.$value` per DTCG 2025.10 §8.5. */
export interface TransitionValue {
  duration?: unknown;
  timingFunction?: unknown;
  delay?: unknown;
}

/**
 * Single layer of `shadow.$value`. Per DTCG 2025.10 §8.6, `shadow`
 * may be a single object or an array of layers; consumers should
 * normalize via `Array.isArray(...) ? value : [value]` and then iterate
 * `ShadowLayer[]`.
 */
export interface ShadowLayer {
  color?: unknown;
  offsetX?: unknown;
  offsetY?: unknown;
  blur?: unknown;
  spread?: unknown;
  inset?: unknown;
}

/** Single stop of `gradient.$value` per DTCG 2025.10 §8.3. */
export interface GradientStop {
  color?: unknown;
  position?: unknown;
}

/** `dimension` / `duration` object form per DTCG 2025.10 (`{ value, unit }`). */
export interface DimensionValue {
  value?: unknown;
  unit?: unknown;
}

/**
 * `color.$value` per DTCG 2025.10 §8.1. Either the explicit
 * `colorSpace + components` form, or the legacy `hex` short-form
 * that pre-DTCG-2025 fixtures still use. `channels` is the older
 * alias for `components` retained for back-compat with token sources
 * that haven't migrated.
 */
export interface ColorValue {
  colorSpace?: unknown;
  components?: unknown;
  channels?: unknown;
  alpha?: unknown;
  hex?: unknown;
}

/**
 * `strokeStyle.$value` per DTCG 2025.10 §8.2 — either a literal string
 * (`'solid' | 'dashed' | ...`) or an object describing a dashed
 * pattern. Object form is typed here; consumers handle the string
 * form via a runtime `typeof === 'string'` check.
 */
export interface DashedStrokeStyleValue {
  dashArray?: unknown;
  lineCap?: unknown;
}

/** Every DTCG `$type` swatchbook presents. */
export type TokenType =
  | 'color'
  | 'gradient'
  | 'dimension'
  | 'shadow'
  | 'border'
  | 'transition'
  | 'typography'
  | 'fontFamily'
  | 'fontWeight'
  | 'strokeStyle'
  | 'number'
  | 'duration'
  | 'cubicBezier';

/**
 * The realised top-level `$value` shape per `$type`. Narrows the envelope a
 * presenter reads without re-casting; sub-values stay `unknown` (a sub-value
 * may be a primitive, a resolved alias string, or a nested composite), same
 * as the envelopes themselves.
 */
export type TokenValue<T extends TokenType> = T extends 'color'
  ? ColorValue
  : T extends 'gradient'
    ? GradientStop[]
    : T extends 'shadow'
      ? ShadowLayer | ShadowLayer[]
      : T extends 'border'
        ? BorderValue
        : T extends 'transition'
          ? TransitionValue
          : T extends 'typography'
            ? TypographyValue
            : T extends 'strokeStyle'
              ? string | DashedStrokeStyleValue
              : T extends 'fontFamily'
                ? string | string[]
                : T extends 'fontWeight'
                  ? number | string
                  : T extends 'number'
                    ? number
                    : T extends 'cubicBezier'
                      ? number[]
                      : T extends 'dimension' | 'duration'
                        ? string | number | DimensionValue
                        : unknown;

/**
 * A fully-realised token: concrete `$value` (aliases already resolved, no
 * graph lookup), typed per `$type` via `TokenValue<T>`, plus DTCG metadata a
 * presenter may show. The presenter tier consumes this; resolution is the
 * caller's job. Typing `$value` per `$type` lets a presenter holding a
 * concrete `RealisedToken<T>` read the envelope without re-casting, and makes
 * a wrong-shape literal a compile error.
 */
export interface RealisedToken<T extends TokenType = TokenType> {
  $type: T;
  $value: TokenValue<T>;
  $description?: string;
  $deprecated?: string | boolean;
}
