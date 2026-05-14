import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { defineConfig as defineTerrazzoConfig, parse } from '@terrazzo/parser';
import type { BufferedLogger } from '#/diagnostics.ts';
import {
  cartesianSize,
  collectGlobbedFiles,
  DEFAULT_MAX_PERMUTATIONS,
  permutationGuardDiagnostic,
} from '#/permutations/util.ts';
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
 * Each axis context supplies an ordered list of overlay files; for every
 * tuple in the cartesian product we parse
 * `[...base, ...overlayFilesInAxisOrder]` with alias resolution enabled.
 * Terrazzo's parser applies last-write-wins semantics on duplicate token
 * paths, so overlay files override base tokens in the order we concatenate
 * them.
 */
export async function loadLayeredPermutations(
  axesConfig: AxisConfig[],
  tokenGlobs: string[],
  cwd: string,
  logger: BufferedLogger,
  maxPermutations: number = DEFAULT_MAX_PERMUTATIONS,
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

  // Guard against pathological cartesian products. Same shape as the
  // resolver path — load only the default tuple when the space exceeds
  // `maxPermutations`.
  const diagnostics: Diagnostic[] = [];
  const size = cartesianSize(axes);
  const guardActive = maxPermutations > 0 && size > maxPermutations;
  const tuples = guardActive
    ? [Object.fromEntries(axesConfig.map((ax) => [ax.name, ax.default]))]
    : cartesianTuples(axesConfig);
  if (guardActive) diagnostics.push(permutationGuardDiagnostic(size, maxPermutations));

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

  const perTuple = await Promise.all(
    tuples.map(async (input) => {
      const overlayFiles: string[] = [];
      for (const ax of axesConfig) {
        const ctx = input[ax.name];
        if (ctx === undefined) continue;
        const patterns = ax.contexts[ctx] ?? [];
        overlayFiles.push(...filesForAxisContext(ax.name, ctx, patterns));
      }
      const allFiles = [...baseFiles, ...overlayFiles];
      const inputs = await Promise.all(allFiles.map(readInput));
      const parsed = await parse(inputs, {
        logger,
        config: terrazzoConfig,
        resolveAliases: true,
        continueOnError: true,
      });
      return { input, allFiles, tokens: parsed.tokens };
    }),
  );

  const permutations: Permutation[] = [];
  const resolved: Record<string, TokenMap> = {};
  const sourceSet = new Set<string>();
  for (const { input, allFiles, tokens } of perTuple) {
    const id = permutationID(input);
    permutations.push({ name: id, input: { ...input }, sources: allFiles });
    resolved[id] = tokens;
    for (const f of allFiles) sourceSet.add(f);
  }

  return { axes, permutations, resolved, sourceFiles: [...sourceSet].toSorted(), diagnostics };
}

function cartesianTuples(axesConfig: AxisConfig[]): Record<string, string>[] {
  if (axesConfig.length === 0) return [{}];
  let acc: Record<string, string>[] = [{}];
  for (const ax of axesConfig) {
    const contexts = Object.keys(ax.contexts);
    const next: Record<string, string>[] = [];
    for (const partial of acc) {
      for (const ctx of contexts) {
        next.push({ ...partial, [ax.name]: ctx });
      }
    }
    acc = next;
  }
  return acc;
}
