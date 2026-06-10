/**
 * When `transformCSSValue` throws on a malformed token `$value`, the
 * smart emitter wraps the error with the token path + active
 * permutation + offending `$value`. Without that wrap a consumer sees
 * a colorjs.io traceback four frames deep with no clue which token
 * triggered it.
 */
import type { TokenNormalized } from '@terrazzo/parser';
import { transformCSSValue } from '@terrazzo/token-tools/css';
import { expect, it } from 'vitest';
import { collectTokenDeclarations } from '#/css-axis-projected.ts';

// The real value transform — collectTokenDeclarations wraps whatever this
// throws with token context, so the malformed token must reach transformCSSValue.
const transformValue = (
  token: TokenNormalized,
  tokensSet: Record<string, TokenNormalized>,
  permutation: Record<string, string>,
) => transformCSSValue(token, { tokensSet, permutation });

it('rethrows with token path, permutation, and $value when transformCSSValue fails', () => {
  // A color token whose `components` field is missing — exactly the
  // shape that triggers colorjs.io's `coords.map is not a function`
  // inside `tokenToColor` → `inGamut`.
  const malformed = {
    id: 'color.broken',
    jsonID: 'color.broken',
    $type: 'color',
    $value: { colorSpace: 'srgb', alpha: 1 },
    aliasChain: [],
    aliasedBy: [],
    dependencies: [],
    group: { id: 'color' },
  } as unknown as TokenNormalized;

  const run = () => {
    for (const _ of collectTokenDeclarations(
      'color.broken',
      malformed,
      { 'color.broken': malformed },
      { mode: 'Dark', brand: 'Brand A' },
      { prefix: 'sb' },
      transformValue,
    )) {
      // exhaust the generator
    }
  };

  expect(run).toThrowError(/color\.broken/);
  expect(run).toThrowError(/"mode":"Dark"/);
  expect(run).toThrowError(/"brand":"Brand A"/);
  expect(run).toThrowError(/\$type: color/);
});

it('preserves the underlying error as cause', () => {
  const malformed = {
    id: 'color.broken',
    jsonID: 'color.broken',
    $type: 'color',
    $value: { colorSpace: 'srgb', alpha: 1 },
    aliasChain: [],
    aliasedBy: [],
    dependencies: [],
    group: { id: 'color' },
  } as unknown as TokenNormalized;

  let caught: unknown;
  try {
    for (const _ of collectTokenDeclarations(
      'color.broken',
      malformed,
      { 'color.broken': malformed },
      {},
      { prefix: 'sb' },
      transformValue,
    )) {
      // exhaust the generator
    }
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(Error);
  expect((caught as Error).cause).toBeInstanceOf(Error);
});
