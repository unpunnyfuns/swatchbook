import { dirname, resolve as resolvePath } from 'node:path';
import { expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { loadProject } from '#/load';
import { fixtureCwd } from './_helpers';

it('populates sourceFiles with every $ref target when config.tokens is omitted', async () => {
  const project = await loadProject({ resolver: resolverPath }, fixtureCwd);

  expect(project.sourceFiles.length).toBeGreaterThan(5);
  expect(project.sourceFiles).toContain(resolverPath);
  expect(project.sourceFiles).toContain(resolvePath(tokensDir, 'color.json'));
  expect(project.sourceFiles).toContain(resolvePath(tokensDir, 'size.json'));
  expect(project.sourceFiles).toContain(resolvePath(tokensDir, 'themes/light.json'));
});

it('augments sourceFiles with explicit tokens globs when both are supplied', async () => {
  const project = await loadProject(
    { resolver: resolverPath, tokens: ['tokens/**/*.json'] },
    fixtureCwd,
  );

  // Every source file is inside the fixture's tokens tree.
  const fixtureRoot = dirname(tokensDir);
  for (const file of project.sourceFiles) {
    expect(file.startsWith(fixtureRoot)).toBe(true);
  }
  expect(project.sourceFiles).toContain(resolverPath);
});

it('throws when config has neither resolver, axes, nor tokens', async () => {
  await expect(loadProject({}, fixtureCwd)).rejects.toThrow(
    /must specify `resolver`, `axes`, or non-empty `tokens`/,
  );
});

it('throws when config.axes is set without config.tokens', async () => {
  await expect(
    loadProject(
      {
        axes: [{ name: 'mode', contexts: { Light: [] }, default: 'Light' }],
      },
      fixtureCwd,
    ),
  ).rejects.toThrow(/`axes` must also supply `tokens`/);
});
