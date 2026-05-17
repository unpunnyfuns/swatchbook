/**
 * Gating half of `normalizePermutations` — guards against mutually-
 * exclusive config combinations. No filesystem touch; all three tests
 * exercise the early-return throws.
 *
 * The dispatch half (resolver / layered / plain-parse selection against
 * a real workspace) lives in `permutations-normalize-dispatch.test.ts`.
 */
import { expect, it } from 'vitest';
import { BufferedLogger } from '#/diagnostics.ts';
import { normalizePermutations } from '#/permutations/normalize.ts';
import type { Config } from '#/types.ts';

it('throws when both `resolver` and `axes` are supplied', async () => {
  const config: Config = {
    resolver: 'whatever.json',
    axes: [{ name: 'mode', contexts: { Light: [], Dark: [] }, default: 'Light' }],
  };
  await expect(normalizePermutations(config, '/cwd', new BufferedLogger())).rejects.toThrow(
    /either `resolver` or `axes`, not both/,
  );
});

it('throws when `axes` is set but `tokens` is missing', async () => {
  const config: Config = {
    axes: [{ name: 'mode', contexts: { Light: [], Dark: [] }, default: 'Light' }],
  };
  await expect(normalizePermutations(config, '/cwd', new BufferedLogger())).rejects.toThrow(
    /must also supply `tokens`/,
  );
});

it('throws when `axes` is set with an empty `tokens` array', async () => {
  const config: Config = {
    axes: [{ name: 'mode', contexts: { Light: [], Dark: [] }, default: 'Light' }],
    tokens: [],
  };
  await expect(normalizePermutations(config, '/cwd', new BufferedLogger())).rejects.toThrow(
    /must also supply `tokens`/,
  );
});
