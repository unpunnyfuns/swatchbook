import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Config, Project } from '@unpunnyfuns/swatchbook-core';
import { loadProject } from '@unpunnyfuns/swatchbook-core';
import { createJiti } from 'jiti';

/**
 * Discover and load a swatchbook project from a config file path. Accepts
 * `.ts`, `.mts`, `.js`, `.mjs` — jiti handles them all. The `cwd` returned
 * is the directory the config lives in, which `loadProject` uses to resolve
 * relative token / resolver paths.
 */
export async function loadFromConfig(
  configPath: string,
  cwdOverride?: string,
): Promise<{ project: Project; cwd: string; config: Config }> {
  const absolute = isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);
  const cwd = cwdOverride ?? resolve(absolute, '..');

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
  const loaded = (await jiti.import(absolute, { default: true })) as Config;

  const project = await loadProject(loaded, cwd);
  return { project, cwd, config: loaded };
}
