import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { dirname } from 'node:path';
import { expect, it } from 'vitest';
import { loadProject } from '#/load.ts';

const fixtureCwd = dirname(tokensDir);

it('surfaces defaultColorFormat from config (default hex)', async () => {
  const base = await loadProject({ resolver: resolverPath }, fixtureCwd);
  expect(base.config.defaultColorFormat).toBe('hex');
  const oklch = await loadProject(
    { resolver: resolverPath, defaultColorFormat: 'oklch' },
    fixtureCwd,
  );
  expect(oklch.config.defaultColorFormat).toBe('oklch');
});
