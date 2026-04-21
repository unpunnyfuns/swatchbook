import { extname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Config, Project } from '@unpunnyfuns/swatchbook-core';
import { loadProject } from '@unpunnyfuns/swatchbook-core';
import { createJiti } from 'jiti';

/**
 * Load a swatchbook project from either a full config module or a bare
 * DTCG resolver JSON.
 *
 * `.ts` / `.mts` / `.js` / `.mjs` → jiti imports the module and uses
 * its default export as the swatchbook {@link Config}.
 *
 * `.json` → treated as a DTCG resolver file; the CLI constructs a
 * minimal `{ resolver: path }` config so agents can point at a raw
 * resolver without authoring a wrapper. Every other config option
 * (presets, chrome map, disabled axes, css-var prefix) falls back to
 * `loadProject` defaults.
 *
 * The `cwd` returned is the directory the config / resolver lives in.
 * `loadProject` uses it to resolve relative token references.
 */
export async function loadFromConfig(
  configPath: string,
  cwdOverride?: string,
): Promise<{ project: Project; cwd: string; config: Config }> {
  const absolute = isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);
  const cwd = cwdOverride ?? resolve(absolute, '..');
  const ext = extname(absolute).toLowerCase();

  const config =
    ext === '.json' ? ({ resolver: absolute } satisfies Config) : await loadTsConfig(absolute);

  const project = await loadProject(config, cwd);
  return { project, cwd, config };
}

async function loadTsConfig(absolute: string): Promise<Config> {
  /**
   * jiti's first arg is a directory-shaped "from" URL it uses to resolve
   * the target's relative imports. Passing a file URL leaves jiti
   * unsure whether to treat the path as a dir, which on some Node
   * versions falls through to a plain JSON read and surfaces as
   * `Unexpected token 'i', "import { d"...`. A trailing slash on a
   * directory URL avoids the ambiguity.
   */
  const fromUrl = new URL('./', pathToFileURL(absolute));
  const jiti = createJiti(fromUrl.href, {
    interopDefault: true,
    moduleCache: false,
  });
  return (await jiti.import(absolute, { default: true })) as Config;
}
