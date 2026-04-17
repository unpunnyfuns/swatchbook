import { glob } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isAbsolute, resolve as resolvePath } from 'node:path';
import { defineConfig as defineTerrazzoConfig, parse } from '@terrazzo/parser';
import type { Theme, ThemeConfig, TokenMap } from '#/types';
import type { BufferedLogger } from '#/diagnostics';

export interface LayeredLoadResult {
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  defaultThemeName: string;
}

/**
 * Realize themes from an explicit `themes: ThemeConfig[]` config.
 * Each theme's `layers` glob list is parsed independently; aliases across
 * layers resolve because Terrazzo sees them in a single `parse` call.
 */
export async function loadLayeredThemes(
  themeConfigs: ThemeConfig[],
  cwd: string,
  logger: BufferedLogger,
  explicitDefault?: string,
): Promise<LayeredLoadResult> {
  if (themeConfigs.length === 0) {
    throw new Error('swatchbook: `themes` is set but empty.');
  }

  const themes: Theme[] = [];
  const resolved: Record<string, TokenMap> = {};

  const cwdUrl = pathToFileURL(`${cwd}/`);
  const terrazzoConfig = defineTerrazzoConfig({}, { logger, cwd: cwdUrl });

  for (const themeConfig of themeConfigs) {
    const files = await expandLayers(themeConfig.layers, cwd);
    const inputs = await Promise.all(
      files.map(async (filename) => ({
        filename: pathToFileURL(filename),
        src: await readFile(filename, 'utf8'),
      })),
    );

    const result = await parse(inputs, {
      logger,
      config: terrazzoConfig,
      resolveAliases: true,
      continueOnError: true,
    });

    resolved[themeConfig.name] = result.tokens;
    themes.push({
      name: themeConfig.name,
      input: { theme: themeConfig.name },
      sources: files,
    });
  }

  const defaultThemeName =
    explicitDefault && resolved[explicitDefault] ? explicitDefault : (themes[0]?.name ?? '');

  return { themes, resolved, defaultThemeName };
}

/** Expand an ordered list of glob patterns into an ordered list of files. */
async function expandLayers(patterns: string[], cwd: string): Promise<string[]> {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const pattern of patterns) {
    const absolute = isAbsolute(pattern) ? pattern : resolvePath(cwd, pattern);
    for await (const match of glob(pattern, { cwd })) {
      const full = isAbsolute(match) ? match : resolvePath(cwd, match);
      if (!seen.has(full)) {
        seen.add(full);
        out.push(full);
      }
    }
    // If the pattern had no glob characters and didn't expand, treat as a literal path.
    if (!hasGlobChars(pattern) && !seen.has(absolute)) {
      seen.add(absolute);
      out.push(absolute);
    }
  }
  return out;
}

function hasGlobChars(p: string): boolean {
  return /[*?[\]{}]/.test(p);
}
