import type { BufferedLogger } from '#/diagnostics.ts';
import { loadLayeredPermutations } from '#/permutations/layered.ts';
import { loadResolverPermutations } from '#/permutations/resolver.ts';
import type { Axis, Config, Diagnostic, ParserInput, Permutation, TokenMap } from '#/types.ts';

export interface NormalizedPermutations {
  axes: Axis[];
  permutations: Permutation[];
  resolved: Record<string, TokenMap>;
  sourceFiles: string[];
  /** Present for resolver + plain-parse paths; undefined for layered. */
  parserInput?: ParserInput;
  diagnostics: Diagnostic[];
}

/**
 * Realize permutations from the config. Exactly one of `resolver` or
 * `axes` may be set; when neither is set, we fall back to a single
 * synthetic axis containing the plain-parsed token files (which then
 * must be supplied via `config.tokens`).
 */
export async function normalizePermutations(
  config: Config,
  cwd: string,
  logger: BufferedLogger,
): Promise<NormalizedPermutations> {
  if (config.resolver && config.axes) {
    throw new Error('swatchbook: config must specify either `resolver` or `axes`, not both.');
  }

  if (config.axes) {
    if (!config.tokens || config.tokens.length === 0) {
      throw new Error(
        'swatchbook: config with `axes` must also supply `tokens` (the base token files the overlays layer onto).',
      );
    }
    return loadLayeredPermutations(config.axes, config.tokens, cwd, logger);
  }

  return loadResolverPermutations(config.resolver, config.tokens, cwd, logger);
}
