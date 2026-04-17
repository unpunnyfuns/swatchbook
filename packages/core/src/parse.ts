import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { defineConfig as defineTerrazzoConfig, parse, type ParseResult } from '@terrazzo/parser';
import type { BufferedLogger } from '#/diagnostics';

/**
 * Load and parse every DTCG token file matched by the given globs.
 *
 * Thin wrapper around Terrazzo's `parse` that handles the common glob →
 * `InputSource[]` plumbing and wires our buffered logger in. Aliases are
 * resolved eagerly; recoverable errors surface on the logger rather than
 * throwing.
 */
export async function parseGlobs(
  globs: string[],
  cwd: string,
  logger: BufferedLogger,
): Promise<ParseResult> {
  const files = await collectFiles(globs, cwd);
  const inputs = await Promise.all(
    files.map(async (filename) => ({
      filename: pathToFileURL(filename),
      src: await readFile(filename, 'utf8'),
    })),
  );

  const config = defineTerrazzoConfig({}, { logger, cwd: pathToFileURL(`${cwd}/`) });

  return parse(inputs, {
    logger,
    config,
    resolveAliases: true,
    continueOnError: true,
  });
}

async function collectFiles(globs: string[], cwd: string): Promise<string[]> {
  const results = new Set<string>();
  for (const pattern of globs) {
    for await (const match of glob(pattern, { cwd })) {
      results.add(match.startsWith('/') ? match : `${cwd}/${match}`);
    }
  }
  return [...results].sort();
}
