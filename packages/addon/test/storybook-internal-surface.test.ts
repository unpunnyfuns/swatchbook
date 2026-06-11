import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

/**
 * `storybook/internal/*` paths are unstable across Storybook MAJOR versions —
 * each one is a migration point at the next major bump. This pins the set we
 * knowingly depend on; adding a new one fails here, forcing a conscious edit
 * (and a glance at CLAUDE.md's Storybook major-bump checklist) rather than the
 * surface creeping silently.
 */
const ALLOWED = new Set(['storybook/internal/components', 'storybook/internal/csf']);

const SRC = join(process.cwd(), 'src');

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsFiles(path));
    else if (/\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

it('keeps the storybook/internal/* import surface within the known set', () => {
  const found = new Set<string>();
  for (const file of tsFiles(SRC)) {
    for (const match of readFileSync(file, 'utf8').matchAll(
      /from '(storybook\/internal\/[\w-]+)'/g,
    )) {
      found.add(match[1] as string);
    }
  }
  // Every dependency we have is one we've consciously accepted as a major-bump point.
  for (const spec of found) {
    expect(ALLOWED.has(spec), `unexpected storybook/internal import: ${spec}`).toBe(true);
  }
  // And the set isn't empty for a silly reason (regex drift / moved files).
  expect(found.size).toBeGreaterThan(0);
});
