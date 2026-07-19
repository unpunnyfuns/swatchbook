/**
 * Re-export of the canonical DTCG value envelopes, which now live in core
 * (`@unpunnyfuns/swatchbook-core/token-value-types`). Kept as a thin alias so
 * existing `#/internal/composite-types.ts` importers need no change.
 */
export type {
  ColorValue,
  GradientStop,
  ShadowLayer,
  BorderValue,
  TransitionValue,
  TypographyValue,
  DashedStrokeStyleValue,
  TokenType,
  RealisedToken,
} from '@unpunnyfuns/swatchbook-core/token-value-types';
