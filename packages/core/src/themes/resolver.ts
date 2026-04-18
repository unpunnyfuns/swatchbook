import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig as defineTerrazzoConfig, loadResolver, parse } from '@terrazzo/parser';
import { permutationID, type Axis, type Theme, type TokenMap } from '#/types.ts';
import type { BufferedLogger } from '#/diagnostics.ts';
import { collectGlobbedFiles } from '#/themes/util.ts';

export interface ResolverLoadResult {
  axes: Axis[];
  themes: Theme[];
  resolved: Record<string, TokenMap>;
}

/**
 * Realize themes from a DTCG 2025.10 native resolver file.
 *
 * Terrazzo's `loadResolver` scans the provided input list for a resolver
 * document, normalizes it, then lets us enumerate permutations via
 * `resolver.listPermutations()` and realize each with `resolver.apply()`.
 */
export async function loadResolverThemes(
  resolverPath: string | undefined,
  tokenGlobs: string[],
  cwd: string,
  logger: BufferedLogger,
): Promise<ResolverLoadResult> {
  const cwdUrl = pathToFileURL(`${cwd}/`);
  const terrazzoConfig = defineTerrazzoConfig({}, { logger, cwd: cwdUrl });

  const tokenFiles = await collectGlobbedFiles(tokenGlobs, cwd);

  const req = async (url: URL): Promise<string> => {
    const filename = url.protocol === 'file:' ? fileURLToPath(url) : url.toString();
    return readFile(filename, 'utf8');
  };

  let loaded: Awaited<ReturnType<typeof loadResolver>> | undefined;
  if (resolverPath) {
    const absolute = isAbsolute(resolverPath) ? resolverPath : resolvePath(cwd, resolverPath);
    // `loadResolver` expects the resolver file alone as input and fetches
    // referenced token files via `req`. Passing tokens up front triggers
    // "Resolver must be the only input" errors.
    const resolverInput = {
      filename: pathToFileURL(absolute),
      src: await readFile(absolute, 'utf8'),
    };
    loaded = await loadResolver([resolverInput], {
      config: terrazzoConfig,
      logger,
      req,
    });
  }

  if (!loaded?.resolver) {
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
    const name = 'default';
    return {
      axes: [{ name: 'theme', contexts: [name], default: name, source: 'synthetic' }],
      themes: [{ name, input: { theme: name }, sources: tokenFiles }],
      resolved: { [name]: parsed.tokens },
    };
  }

  const { resolver } = loaded;
  const permutations = resolver.listPermutations();

  const axes: Axis[] = Object.entries(resolver.source.modifiers ?? {}).map(([name, modifier]) => ({
    name,
    contexts: Object.keys(modifier.contexts ?? {}),
    default: modifier.default ?? Object.keys(modifier.contexts ?? {})[0] ?? '',
    ...(modifier.description !== undefined ? { description: modifier.description } : {}),
    source: 'resolver' as const,
  }));

  const themes: Theme[] = [];
  const resolved: Record<string, TokenMap> = {};

  for (const input of permutations) {
    const id = permutationID(input);
    const tokens = resolver.apply(input);
    themes.push({ name: id, input: { ...input }, sources: [] });
    resolved[id] = tokens;
  }

  return { axes, themes, resolved };
}
