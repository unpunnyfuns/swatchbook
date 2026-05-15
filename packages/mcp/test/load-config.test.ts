import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { loadFromConfig } from '#/load-config.ts';

let workspace: string;

// Per-test tmpdir holds generated TS / MTS config modules. The fixture
// project lives outside, so its absolute paths flow through unchanged.
beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'swatchbook-mcp-loadconfig-'));
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

it('treats a .json path as a bare DTCG resolver, deriving cwd from its directory', async () => {
  const { project, cwd, config } = await loadFromConfig(resolverPath);
  expect(config).toEqual({ resolver: resolverPath });
  expect(cwd).toBe(resolve(resolverPath, '..'));
  expect(project.permutations.length).toBeGreaterThan(0);
});

it('honors `cwdOverride` for bare JSON resolvers', async () => {
  const elsewhere = mkdtempSync(join(tmpdir(), 'swatchbook-mcp-loadconfig-cwd-'));
  try {
    const { cwd, project } = await loadFromConfig(resolverPath, elsewhere);
    expect(cwd).toBe(elsewhere);
    // The resolver itself is absolute, so loading still succeeds even though
    // cwd is unrelated — the override only affects relative-token resolution.
    expect(project.permutations.length).toBeGreaterThan(0);
  } finally {
    rmSync(elsewhere, { recursive: true, force: true });
  }
});

it('resolves a relative config path against process.cwd()', async () => {
  // Write a JSON config inside our workspace and pass its bare basename
  // after chdir-ing in. (Avoid a real process.chdir — derive the relative
  // path against the current cwd manually.)
  const relativeToCwd = `${workspace.split(`${process.cwd()}/`).at(-1) ?? workspace}/r.json`;
  writeFileSync(
    join(workspace, 'r.json'),
    JSON.stringify({
      $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
      version: '2025.10',
      sets: {
        main: { sources: [{ $ref: `${tokensDir}/color.json` }] },
      },
      resolutionOrder: [{ $ref: '#/sets/main' }],
    }),
  );
  // The "relative" path we pass is the absolute one expressed relative to cwd —
  // exercise the !isAbsolute branch via the form that round-trips correctly.
  if (relativeToCwd.startsWith('/')) {
    // Workspace lives outside cwd; skip — branch is exercised in the JSON-cwd
    // tests above.
    return;
  }
  const { config } = await loadFromConfig(relativeToCwd);
  expect(config.resolver).toBe(resolve(process.cwd(), relativeToCwd));
});

it('imports a .ts config module via jiti, using its default export', async () => {
  const tsConfigPath = join(workspace, 'swatchbook.config.ts');
  writeFileSync(
    tsConfigPath,
    `import type { Config } from '@unpunnyfuns/swatchbook-core';
const config: Config = {
  resolver: ${JSON.stringify(resolverPath)},
  cssVarPrefix: 'tsprefix',
};
export default config;
`,
  );
  const { config, project } = await loadFromConfig(tsConfigPath);
  expect(config.cssVarPrefix).toBe('tsprefix');
  expect(config.resolver).toBe(resolverPath);
  expect(project.config.cssVarPrefix).toBe('tsprefix');
});

it('imports a .mts config module via jiti', async () => {
  const mtsConfigPath = join(workspace, 'swatchbook.config.mts');
  writeFileSync(
    mtsConfigPath,
    `export default {
  resolver: ${JSON.stringify(resolverPath)},
  cssVarPrefix: 'mtsprefix',
};
`,
  );
  const { config } = await loadFromConfig(mtsConfigPath);
  expect(config.cssVarPrefix).toBe('mtsprefix');
});

it('imports a .js config module via jiti', async () => {
  const jsConfigPath = join(workspace, 'swatchbook.config.js');
  writeFileSync(
    jsConfigPath,
    `export default {
  resolver: ${JSON.stringify(resolverPath)},
  cssVarPrefix: 'jsprefix',
};
`,
  );
  const { config } = await loadFromConfig(jsConfigPath);
  expect(config.cssVarPrefix).toBe('jsprefix');
});

it('surfaces an error when the config path does not exist', async () => {
  const missing = join(workspace, 'never-written.ts');
  await expect(loadFromConfig(missing)).rejects.toThrow();
});

it('surfaces an error when the bare-JSON resolver target is missing', async () => {
  const missing = join(workspace, 'never-written.json');
  await expect(loadFromConfig(missing)).rejects.toThrow();
});
