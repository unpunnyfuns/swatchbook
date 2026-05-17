import { globSync } from 'node:fs';
import { isAbsolute, resolve as resolvePath } from 'node:path';

/** Expand globs relative to cwd, returning deduplicated absolute paths in sorted order. */
export function collectGlobbedFiles(patterns: string[], cwd: string): string[] {
  const seen = new Set<string>();
  for (const pattern of patterns) {
    for (const match of globSync(pattern, { cwd })) {
      const absolute = isAbsolute(match) ? match : resolvePath(cwd, match);
      seen.add(absolute);
    }
  }
  return [...seen].toSorted();
}
