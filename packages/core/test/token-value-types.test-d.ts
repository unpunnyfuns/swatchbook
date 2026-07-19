import { expectTypeOf, it } from 'vitest';
import type { RealisedToken, ShadowLayer, TokenType } from '#/token-value-types.ts';

it('RealisedToken narrows $type and carries realised value + metadata', () => {
  const t: RealisedToken<'shadow'> = { $type: 'shadow', $value: [], $description: 'x' };
  expectTypeOf(t.$type).toEqualTypeOf<'shadow'>();
  expectTypeOf<ShadowLayer>().toHaveProperty('offsetX');
  expectTypeOf<TokenType>().toMatchTypeOf<string>();
});
