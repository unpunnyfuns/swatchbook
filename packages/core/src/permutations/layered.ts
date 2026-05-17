import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { defineConfig as defineTerrazzoConfig, parse } from '@terrazzo/parser';
import type { BufferedLogger } from '#/diagnostics.ts';
import { collectGlobbedFiles } from '#/permutations/util.ts';
import {
  type Axis,
  type AxisConfig,
  type Diagnostic,
  type Permutation,
  permutationID,
  type TokenMap,
} from '#/types.ts';

export interface LayeredLoadResult {
  axes: Axis[];
  permutations: Permutation[];
  resolved: Record<string, TokenMap>;
  sourceFiles: string[];
  diagnostics: Diagnostic[];
}

/**
 * Realize permutations from a layered (resolver-less) configuration.
 *
 * Enumerates `1 + Σ(axes × (contexts - 1))` singleton tuples — the
 * default tuple plus one per `(axis, non-default-context)` — and
 * parses `[base, ...overlays-for-tuple]` per singleton. Bounded by
 * axis cardinality, independent of the cartesian product.
 *
 * Joint divergences (two overlays both touching the same token at a
 * multi-non-default tuple) are not probed: there's no resolver to
 * consult for the cartesian truth. The truth model for layered is
 * projection composition over delta cells, so `composeAt` at any
 * multi-non-default tuple applies each axis's delta on top of the
 * baseline in axis order. The result matches what consumers already
 * see at runtime under multi-attribute CSS selectors.
 */
export async function loadLayeredPermutations(
  axesConfig: AxisConfig[],
  tokenGlobs: string[],
  cwd: string,
  logger: BufferedLogger,
): Promise<LayeredLoadResult> {
  const cwdUrl = pathToFileURL(`${cwd}/`);
  const terrazzoConfig = defineTerrazzoConfig({}, { logger, cwd: cwdUrl });

  const baseFiles = await collectGlobbedFiles(tokenGlobs, cwd);

  const axes: Axis[] = axesConfig.map((ax) => ({
    name: ax.name,
    contexts: Object.keys(ax.contexts),
    default: ax.default,
    ...(ax.description !== undefined ? { description: ax.description } : {}),
    source: 'layered' as const,
  }));

  const fileCache = new Map<string, string>();
  const readInput = async (filename: string) => {
    let src = fileCache.get(filename);
    if (src === undefined) {
      src = await readFile(filename, 'utf8');
      fileCache.set(filename, src);
    }
    return { filename: pathToFileURL(filename), src };
  };

  const contextFilesCache = new Map<string, string[]>();
  const filesForAxisContext = (axisName: string, ctx: string, patterns: string[]): string[] => {
    const key = `${axisName}::${ctx}`;
    let files = contextFilesCache.get(key);
    if (!files) {
      files = patterns.length === 0 ? [] : collectGlobbedFiles(patterns, cwd);
      contextFilesCache.set(key, files);
    }
    return files;
  };

  const overlayFilesFor = (input: Record<string, string>): string[] => {
    const overlays: string[] = [];
    for (const ax of axesConfig) {
      const ctx = input[ax.name];
      if (ctx === undefined) continue;
      const patterns = ax.contexts[ctx] ?? [];
      overlays.push(...filesForAxisContext(ax.name, ctx, patterns));
    }
    return overlays;
  };

  const parseTuple = async (
    input: Record<string, string>,
  ): Promise<{ input: Record<string, string>; allFiles: string[]; tokens: TokenMap }> => {
    const overlayFiles = overlayFilesFor(input);
    const allFiles = [...baseFiles, ...overlayFiles];
    const inputs = await Promise.all(allFiles.map(readInput));
    const parsed = await parse(inputs, {
      logger,
      config: terrazzoConfig,
      resolveAliases: true,
      continueOnError: true,
    });
    return { input, allFiles, tokens: parsed.tokens };
  };

  const tuples: Record<string, string>[] = [];
  if (axesConfig.length === 0) {
    tuples.push({});
  } else {
    const defaultTuple = Object.fromEntries(axesConfig.map((ax) => [ax.name, ax.default]));
    tuples.push(defaultTuple);
    for (const ax of axesConfig) {
      for (const ctx of Object.keys(ax.contexts)) {
        if (ctx === ax.default) continue;
        tuples.push({ ...defaultTuple, [ax.name]: ctx });
      }
    }
  }

  const perTuple = await Promise.all(tuples.map(parseTuple));

  const permutations: Permutation[] = [];
  const resolved: Record<string, TokenMap> = {};
  const sourceSet = new Set<string>();
  for (const { input, allFiles, tokens } of perTuple) {
    const id = permutationID(input);
    permutations.push({ name: id, input: { ...input }, sources: allFiles });
    resolved[id] = tokens;
    for (const f of allFiles) sourceSet.add(f);
  }

  return { axes, permutations, resolved, sourceFiles: [...sourceSet].toSorted(), diagnostics: [] };
}
