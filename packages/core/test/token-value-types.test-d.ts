import { expectTypeOf, it } from 'vitest';
import type {
  ColorValue,
  DimensionValue,
  GradientStop,
  RealisedToken,
  ShadowLayer,
  TokenType,
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
});

it('a concrete RealisedToken accepts a matching $value and rejects a wrong shape', () => {
  const t: RealisedToken<'typography'> = { $type: 'typography', $value: { fontSize: '16px' } };
  expectTypeOf(t.$value).toEqualTypeOf<TypographyValue>();
  // @ts-expect-error a number is not a valid typography $value
  const bad: RealisedToken<'typography'> = { $type: 'typography', $value: 42 };
  void bad;
});
