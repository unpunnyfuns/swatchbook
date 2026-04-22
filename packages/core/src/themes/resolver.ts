import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig as defineTerrazzoConfig, loadResolver, parse } from '@terrazzo/parser';
import {
  permutationID,
  type Axis,
  type Diagnostic,
  type ParserInput,
  type Theme,
  type TokenMap,
} from '#/types.ts';
import type { BufferedLogger } from '#/diagnostics.ts';
import { collectGlobbedFiles } from '#/themes/util.ts';

export interface ResolverLoadResult {
  axes: Axis[];
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  sourceFiles: string[];
  /** Retained Terrazzo parse output for downstream plugin emission. */
  parserInput?: ParserInput;
  diagnostics: Diagnostic[];
}

/**
 * Realize themes from a DTCG 2025.10 native resolver file.
 *
 * Terrazzo's `loadResolver` scans the provided input list for a resolver
 * document, normalizes it, then lets us enumerate permutations via
 * `resolver.listPermutations()` and realize each with `resolver.apply()`.
 *
 * We intercept Terrazzo's `$ref` fetch callback so every file it pulls in
 * gets recorded on `sourceFiles`. The addon's Vite plugin uses that list
 * for HMR watch paths when the consumer's config doesn't supply an
 * explicit `tokens` glob.
 */
export async function loadResolverThemes(
  resolverPath: string | undefined,
  tokenGlobs: string[] | undefined,
  cwd: string,
  logger: BufferedLogger,
): Promise<ResolverLoadResult> {
  const cwdUrl = pathToFileURL(`${cwd}/`);
  const terrazzoConfig = defineTerrazzoConfig({}, { logger, cwd: cwdUrl });

  const tokenFiles = tokenGlobs ? await collectGlobbedFiles(tokenGlobs, cwd) : [];
  const refFiles = new Set<string>();

  const req = async (url: URL): Promise<string> => {
    const filename = url.protocol === 'file:' ? fileURLToPath(url) : url.toString();
    if (url.protocol === 'file:') refFiles.add(filename);
    return readFile(filename, 'utf8');
  };

  let loaded: Awaited<ReturnType<typeof loadResolver>> | undefined;
  let resolverAbsolute: string | undefined;
  if (resolverPath) {
    resolverAbsolute = isAbsolute(resolverPath) ? resolverPath : resolvePath(cwd, resolverPath);
    // `loadResolver` expects the resolver file alone as input and fetches
    // referenced token files via `req`. Passing tokens up front triggers
    // "Resolver must be the only input" errors.
    const resolverInput = {
      filename: pathToFileURL(resolverAbsolute),
      src: await readFile(resolverAbsolute, 'utf8'),
    };
    loaded = await loadResolver([resolverInput], {
      config: terrazzoConfig,
      logger,
      req,
    });
  }

  if (!loaded?.resolver) {
    // Fall back to plain parse; no resolver found.
    if (tokenFiles.length === 0) {
      throw new Error(
        'swatchbook config must specify `resolver`, `axes`, or non-empty `tokens`. None were set.',
      );
    }
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
      sourceFiles: tokenFiles,
      parserInput: {
        tokens: parsed.tokens,
        sources: parsed.sources,
        resolver: parsed.resolver,
      },
      diagnostics: [],
    };
  }

  const { resolver, tokens: baseTokens, sources: parsedSources } = loaded;
  const permutations = resolver.listPermutations();

  const diagnostics: Diagnostic[] = [];
  const axes: Axis[] = Object.entries(resolver.source.modifiers ?? {}).map(([name, modifier]) => {
    const contexts = Object.keys(modifier.contexts ?? {});
    let defaultContext = modifier.default ?? contexts[0];
    // The DTCG 2025.10 resolver spec allows a modifier with no `default` to
    // fall through to the first context key; a modifier with neither a
    // `default` nor any contexts is a malformed resolver that produces an
    // axis with empty-string `default` downstream. Flag it so users see
    // where the nonsense is coming from instead of debugging from a
    // mysterious `""` theme name.
    if (defaultContext === undefined) {
      diagnostics.push({
        severity: 'warn',
        group: 'swatchbook/resolver',
        message: `Resolver modifier "${name}" has no default and no contexts — axis is unusable.`,
      });
      defaultContext = '';
    }
    return {
      name,
      contexts,
      default: defaultContext,
      ...(modifier.description !== undefined ? { description: modifier.description } : {}),
      source: 'resolver' as const,
    };
  });

  const themes: Theme[] = [];
  const resolved: Record<string, TokenMap> = {};

  for (const input of permutations) {
    const id = permutationID(input);
    const tokens = resolver.apply(input);
    themes.push({ name: id, input: { ...input }, sources: [] });
    resolved[id] = tokens;
  }

  const sourceFiles = [...refFiles];
  if (resolverAbsolute) sourceFiles.push(resolverAbsolute);
  // If the consumer supplied explicit globs, take their union — they may
  // want HMR to watch directories broader than the resolver references.
  for (const f of tokenFiles) if (!sourceFiles.includes(f)) sourceFiles.push(f);

  return {
    axes,
    themes,
    resolved,
    sourceFiles: sourceFiles.toSorted(),
    parserInput: { tokens: baseTokens, sources: parsedSources, resolver },
    diagnostics,
  };
}
