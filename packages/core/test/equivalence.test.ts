import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { loadProject, resolveTheme } from '#/load';
import type { Project } from '#/types';

/**
 * Equivalence: the same logical composition expressed as explicit layers
 * or as a DTCG 2025.10 resolver must produce the same resolved values for
 * the shared sys-layer tokens. Resolver enumerates a richer cross-product
 * (appearance × brand) so we match on `input` shape rather than name.
 */

const fixtureCwd = dirname(tokensDir);

const LAYER_SETS = {
  common: ['tokens/ref/**/*.json', 'tokens/sys/**/*.json', 'tokens/cmp/**/*.json'],
};

function resolverNameFor(resolver: Project, appearance: string, brand = 'default'): string {
  const match = resolver.themes.find(
    (t) => t.input['appearance'] === appearance && t.input['brand'] === brand,
  );
  if (!match) throw new Error(`resolver has no theme for appearance=${appearance} brand=${brand}`);
  return match.name;
}

describe('layered ≡ resolver for shared compositions', () => {
  let layered: Project;
  let resolver: Project;

  beforeAll(async () => {
    [layered, resolver] = await Promise.all([
      loadProject(
        {
          tokens: ['tokens/**/*.json'],
          themes: [
            {
              name: 'Light',
              layers: [...LAYER_SETS.common, 'tokens/themes/light.json'],
            },
            {
              name: 'Dark',
              layers: [...LAYER_SETS.common, 'tokens/themes/dark.json'],
            },
          ],
        },
        fixtureCwd,
      ),
      loadProject({ tokens: ['tokens/**/*.json'], resolver: resolverPath }, fixtureCwd),
    ]);
  }, 30_000);

  it.each([
    ['Light', 'light'],
    ['Dark', 'dark'],
  ])('%s (layered) resolves identically to appearance=%s (resolver)', (layeredName, appearance) => {
    const layeredTokens = resolveTheme(layered, layeredName).tokens;
    const resolverTokens = resolveTheme(resolver, resolverNameFor(resolver, appearance)).tokens;

    const sysKeys = Object.keys(layeredTokens).filter((k) => k.includes('.sys.'));
    expect(sysKeys.length).toBeGreaterThan(20);

    for (const key of sysKeys) {
      const left = layeredTokens[key];
      const right = resolverTokens[key];
      expect(right, `missing in resolver: ${key}`).toBeDefined();
      expect(JSON.stringify(right?.$value), `divergent value for ${key}`).toEqual(
        JSON.stringify(left?.$value),
      );
    }
  });
});
