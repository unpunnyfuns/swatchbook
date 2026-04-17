import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { manifestPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { loadProject, resolveTheme } from '#/load';
import type { Project } from '#/types';

/**
 * The plan's "three-way equivalence" promise is that the same logical
 * composition, expressed through any of (explicit layers | DTCG resolver |
 * Tokens Studio manifest), produces the same resolved token values.
 *
 * Manifest and layered enumerate five named compositions identically. DTCG
 * resolver enumerates the full axis cross-product (6 permutations), which is
 * a semantic superset. For this equivalence suite we compare the shared
 * named compositions (Light, Dark) across layered and manifest, which are
 * unambiguous.
 */

const fixtureCwd = dirname(tokensDir);

const LAYER_SETS = {
  common: ['tokens/ref/**/*.json', 'tokens/sys/**/*.json', 'tokens/cmp/**/*.json'],
};

describe('layered ≡ manifest for shared compositions', () => {
  let layered: Project;
  let manifest: Project;

  beforeAll(async () => {
    [layered, manifest] = await Promise.all([
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
      loadProject({ tokens: ['tokens/**/*.json'], manifest: manifestPath }, fixtureCwd),
    ]);
  }, 30_000);

  it.each(['Light', 'Dark'])('%s resolves identically in both modes', (themeName) => {
    const layeredTokens = resolveTheme(layered, themeName).tokens;
    const manifestTokens = resolveTheme(manifest, themeName).tokens;

    const sysKeys = Object.keys(layeredTokens).filter((k) => k.includes('.sys.'));
    expect(sysKeys.length).toBeGreaterThan(20);

    for (const key of sysKeys) {
      const left = layeredTokens[key];
      const right = manifestTokens[key];
      expect(right, `missing in manifest: ${key}`).toBeDefined();
      expect(JSON.stringify(right?.$value), `divergent value for ${key}`).toEqual(
        JSON.stringify(left?.$value),
      );
    }
  });
});
