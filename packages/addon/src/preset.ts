import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Config } from '@unpunnyfuns/swatchbook-core';
import { createJiti } from 'jiti';
import type { InlineConfig } from 'vite';
import type { AddonOptions } from '#/options';
import { swatchbookTokensPlugin } from '#/virtual/plugin';

interface PresetOptions extends AddonOptions {
  /** Storybook injects this — the `.storybook` directory absolute path. */
  configDir: string;
}

/**
 * Storybook preset entry. Called by Storybook at config time; extends Vite's
 * plugin list with our virtual-module plugin so the preview can import
 * `virtual:swatchbook/tokens`.
 */
export async function viteFinal(
  viteConfig: InlineConfig,
  options: PresetOptions,
): Promise<InlineConfig> {
  const { config, cwd } = await resolveConfig(options);

  const plugins = Array.isArray(viteConfig.plugins) ? [...viteConfig.plugins] : [];
  plugins.push(swatchbookTokensPlugin({ config, cwd }));

  return { ...viteConfig, plugins };
}

/**
 * Append our preview entry so the decorator + globalTypes ship in the
 * preview bundle even under CSF Next's `definePreview` pattern, where
 * consumers don't directly register non-factory addon annotations.
 */
export function previewAnnotations(entry: string[] = []): string[] {
  const previewUrl = import.meta.resolve('@unpunnyfuns/swatchbook-addon/preview');
  return [...entry, fileURLToPath(previewUrl)];
}

async function resolveConfig(options: PresetOptions): Promise<{ config: Config; cwd: string }> {
  const projectRoot = resolve(options.configDir, '..');

  if (options.config) {
    return { config: options.config, cwd: projectRoot };
  }

  const path = options.configPath ?? 'swatchbook.config.ts';
  const absolute = isAbsolute(path) ? path : resolve(options.configDir, path);

  const jiti = createJiti(pathToFileURL(options.configDir).href, {
    interopDefault: true,
    moduleCache: false,
  });
  const loaded = (await jiti.import(absolute, { default: true })) as Config;

  // If the config file isn't at projectRoot, still resolve globs from its dir.
  const cwd = dirname(absolute);
  return { config: loaded, cwd };
}
