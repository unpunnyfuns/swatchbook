import { expectTypeOf, it } from 'vitest';
import type {
  BorderValue,
  ColorValue,
  DashedStrokeStyleValue,
  DimensionValue,
  GradientStop,
  RealisedToken,
  ShadowLayer,
  TokenType,
  TransitionValue,
  TypographyValue,
} from '#/token-value-types.ts';

it('RealisedToken narrows $type and carries realised value + metadata', () => {
  const t: RealisedToken<'shadow'> = { $type: 'shadow', $value: [], $description: 'x' };
  expectTypeOf(t.$type).toEqualTypeOf<'shadow'>();
  expectTypeOf<ShadowLayer>().toHaveProperty('offsetX');
  expectTypeOf<TokenType>().toMatchTypeOf<string>();
});

it('RealisedToken $value is typed per $type', () => {
  expectTypeOf<RealisedToken<'gradient'>['$value']>().toEqualTypeOf<GradientStop[]>();
  expectTypeOf<RealisedToken<'typography'>['$value']>().toEqualTypeOf<TypographyValue>();
  expectTypeOf<RealisedToken<'color'>['$value']>().toEqualTypeOf<ColorValue>();
  expectTypeOf<RealisedToken<'shadow'>['$value']>().toEqualTypeOf<ShadowLayer | ShadowLayer[]>();
  expectTypeOf<RealisedToken<'dimension'>['$value']>().toEqualTypeOf<
    string | number | DimensionValue
  >();
  expectTypeOf<RealisedToken<'fontFamily'>['$value']>().toEqualTypeOf<string | string[]>();
  expectTypeOf<RealisedToken<'border'>['$value']>().toEqualTypeOf<BorderValue>();
  expectTypeOf<RealisedToken<'transition'>['$value']>().toEqualTypeOf<TransitionValue>();
  expectTypeOf<RealisedToken<'strokeStyle'>['$value']>().toEqualTypeOf<
    string | DashedStrokeStyleValue
  >();
  expectTypeOf<RealisedToken<'fontWeight'>['$value']>().toEqualTypeOf<number | string>();
  expectTypeOf<RealisedToken<'number'>['$value']>().toEqualTypeOf<number>();
  expectTypeOf<RealisedToken<'duration'>['$value']>().toEqualTypeOf<
    string | number | DimensionValue
  >();
  expectTypeOf<RealisedToken<'cubicBezier'>['$value']>().toEqualTypeOf<number[]>();
});

it('a concrete RealisedToken accepts a matching $value and rejects a wrong shape', () => {
  const t: RealisedToken<'typography'> = { $type: 'typography', $value: { fontSize: '16px' } };
  expectTypeOf(t.$value).toEqualTypeOf<TypographyValue>();
  // @ts-expect-error a number is not a valid typography $value
  const bad: RealisedToken<'typography'> = { $type: 'typography', $value: 42 };
  void bad;
});

it('the default RealisedToken couples each $type to its own $value', () => {
  // A matching pair compiles (assignable to the union's `color` member).
  const ok: RealisedToken = { $type: 'color', $value: { hex: '#3b82f6' } };
  void ok;
  // @ts-expect-error 'color' does not pair with a numeric $value in the coupled union
  const mismatch: RealisedToken = { $type: 'color', $value: 42 };
  void mismatch;
});
