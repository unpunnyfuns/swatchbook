import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load';

const fixtureCwd = dirname(tokensDir);

describe('loadProject — validation', () => {
  it('throws when both `resolver` and `axes` are set', async () => {
    await expect(
      loadProject(
        {
          tokens: [],
          resolver: resolverPath,
          axes: [{ name: 'mode', contexts: { Light: [] }, default: 'Light' }],
        },
        fixtureCwd,
      ),
    ).rejects.toThrow(/either `resolver` or `axes`, not both/);
  });
});
