import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import type { Config } from '#/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureCwd = resolve(here, 'fixtures/layered');

describe('loadProject — layered config validation', () => {
  it('throws when both resolver and axes are set', async () => {
    const config = {
      tokens: ['base/*.json'],
      resolver: 'resolver.json',
      axes: [{ name: 'mode', contexts: { Light: [] }, default: 'Light' }],
    } satisfies Config;
    await expect(loadProject(config, fixtureCwd)).rejects.toThrow(
      /either `resolver` or `axes`, not both/,
    );
  });

  it('accepts a tokens-only config and synthesizes a single theme axis', async () => {
    const project = await loadProject({ tokens: ['base/*.json'] }, fixtureCwd);
    expect(project.axes).toEqual([
      { name: 'theme', contexts: ['default'], default: 'default', source: 'synthetic' },
    ]);
    expect(project.themes.map((t) => t.name)).toEqual(['default']);
  });
});
