import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { collectGlobbedFiles } from '#/permutations/util.ts';

function fixtureDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'swatchbook-glob-'));
  writeFileSync(join(dir, 'a.json'), '{}');
  writeFileSync(join(dir, 'b.json'), '{}');
  mkdirSync(join(dir, 'sub'));
  writeFileSync(join(dir, 'sub', 'c.json'), '{}');
  return dir;
}

it('returns absolute paths in sorted order', () => {
  const dir = fixtureDir();
  const result = collectGlobbedFiles(['*.json', 'sub/*.json'], dir);
  expect(result).toEqual([join(dir, 'a.json'), join(dir, 'b.json'), join(dir, 'sub', 'c.json')]);
});

it('deduplicates files matched by overlapping patterns', () => {
  const dir = fixtureDir();
  const result = collectGlobbedFiles(['*.json', '*.json', 'a.json'], dir);
  expect(result.filter((p) => p.endsWith('a.json'))).toHaveLength(1);
});

it('returns an empty array when nothing matches', () => {
  const dir = fixtureDir();
  expect(collectGlobbedFiles(['*.css'], dir)).toEqual([]);
});
