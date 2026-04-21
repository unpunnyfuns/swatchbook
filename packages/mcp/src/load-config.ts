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

  const jiti = createJiti(pathToFileURL(absolute).href, {
    interopDefault: true,
    moduleCache: false,
  });
  const loaded = (await jiti.import(absolute, { default: true })) as Config;

  const project = await loadProject(loaded, cwd);
  return { project, cwd, config: loaded };
}
