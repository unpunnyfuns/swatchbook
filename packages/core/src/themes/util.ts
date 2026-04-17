import { glob } from 'node:fs/promises';
import { isAbsolute, resolve as resolvePath } from 'node:path';

/** Expand globs relative to cwd, returning deduplicated absolute paths in sorted order. */
export async function collectGlobbedFiles(patterns: string[], cwd: string): Promise<string[]> {
  const seen = new Set<string>();
  for (const pattern of patterns) {
    for await (const match of glob(pattern, { cwd })) {
      const absolute = isAbsolute(match) ? match : resolvePath(cwd, match);
      seen.add(absolute);
    }
  }
  return [...seen].sort();
}
