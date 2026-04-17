import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig as defineTerrazzoConfig, loadResolver, parse } from '@terrazzo/parser';
import type { Theme, TokenMap } from '#/types';
import type { BufferedLogger } from '#/diagnostics';
import { collectGlobbedFiles } from '#/themes/util';

export interface ResolverLoadResult {
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  defaultThemeName: string;
}

/**
 * Realize themes from a DTCG 2025.10 native resolver file.
 *
 * Terrazzo's `loadResolver` scans the provided input list for a resolver
 * document, normalizes it, then lets us enumerate permutations via
 * `resolver.listPermutations()` and realize each with `resolver.apply()`.
 */
export async function loadResolverThemes(
  resolverPath: string,
  tokenGlobs: string[],
  cwd: string,
  logger: BufferedLogger,
  explicitDefault?: string,
): Promise<ResolverLoadResult> {
  const absolute = isAbsolute(resolverPath) ? resolverPath : resolvePath(cwd, resolverPath);
  const cwdUrl = pathToFileURL(`${cwd}/`);
  const terrazzoConfig = defineTerrazzoConfig({}, { logger, cwd: cwdUrl });

  const tokenFiles = await collectGlobbedFiles(tokenGlobs, cwd);

  // `loadResolver` expects the resolver file alone as input and fetches
  // referenced token files via `req`. Passing tokens up front triggers
  // "Resolver must be the only input" errors.
  const resolverInput = {
    filename: pathToFileURL(absolute),
    src: await readFile(absolute, 'utf8'),
  };

  const req = async (url: URL): Promise<string> => {
    const filename = url.protocol === 'file:' ? fileURLToPath(url) : url.toString();
    return readFile(filename, 'utf8');
  };

  const loaded = await loadResolver([resolverInput], {
    config: terrazzoConfig,
    logger,
    req,
  });

  if (!loaded.resolver) {
    // Fall back to plain parse; no resolver found.
    const tokenInputs = await Promise.all(
      tokenFiles.map(async (filename) => ({
        filename: pathToFileURL(filename),
        src: await readFile(filename, 'utf8'),
      })),
    );
    const parsed = await parse(tokenInputs, {
      logger,
      config: terrazzoConfig,
      resolveAliases: true,
      continueOnError: true,
    });
    const name = explicitDefault ?? 'default';
    return {
      themes: [{ name, input: { theme: name }, sources: tokenFiles }],
      resolved: { [name]: parsed.tokens },
      defaultThemeName: name,
    };
  }

  const { resolver } = loaded;
  const permutations = resolver.listPermutations();

  const themes: Theme[] = [];
  const resolved: Record<string, TokenMap> = {};

  for (const input of permutations) {
    const id = resolver.getPermutationID(input);
    const tokens = resolver.apply(input);
    themes.push({ name: id, input: { ...input }, sources: [] });
    resolved[id] = tokens;
  }

  const defaultThemeName =
    explicitDefault && resolved[explicitDefault] ? explicitDefault : (themes[0]?.name ?? '');

  return { themes, resolved, defaultThemeName };
}
