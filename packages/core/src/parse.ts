import { globSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { defineConfig as defineTerrazzoConfig, parse, type ParseResult } from '@terrazzo/parser';
import type { BufferedLogger } from '#/diagnostics.ts';

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
  const files = collectFiles(globs, cwd);
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

function collectFiles(globs: string[], cwd: string): string[] {
  const results = new Set<string>();
  for (const pattern of globs) {
    for (const match of globSync(pattern, { cwd })) {
      results.add(match.startsWith('/') ? match : `${cwd}/${match}`);
    }
  }
  return [...results].toSorted();
}
