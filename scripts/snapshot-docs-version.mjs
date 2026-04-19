#!/usr/bin/env node
// Snapshot the docusaurus docs/ tree under versioned_docs/version-<MAJOR.MINOR>/
// on every release. Every release rebuilds the current minor's snapshot so doc
// fixes that accompany the release reach the stable docs; a new minor or major
// bump adds a new snapshot alongside the existing ones and leaves older minors
// frozen.
//
// Runs from the root `version` script (after `changeset version` has bumped
// workspace package.json versions), so the snapshot lands in the same
// "Version Packages" PR that Changesets opens.

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const next = JSON.parse(
  readFileSync(join(repoRoot, 'packages/core/package.json'), 'utf8'),
).version;

const match = next.match(/^(\d+)\.(\d+)\.(\d+)/);
if (!match) {
  console.error(`[snapshot-docs] unexpected core version: ${next}`);
  process.exit(1);
}
const [, major, minor] = match;
const series = `${major}.${minor}`;

const versionedDocs = join(repoRoot, 'apps/docs/versioned_docs', `version-${series}`);
const versionedSidebar = join(
  repoRoot,
  'apps/docs/versioned_sidebars',
  `version-${series}-sidebars.json`,
);
const versionsJsonPath = join(repoRoot, 'apps/docs/versions.json');

// docusaurus docs:version refuses to overwrite, so drop any prior snapshot for
// this series (plus its versions.json entry) before re-running. Older minors
// are left alone — they stay frozen at their last patch's snapshot.
if (existsSync(versionedDocs)) {
  rmSync(versionedDocs, { recursive: true, force: true });
}
if (existsSync(versionedSidebar)) {
  rmSync(versionedSidebar, { force: true });
}
if (existsSync(versionsJsonPath)) {
  const list = JSON.parse(readFileSync(versionsJsonPath, 'utf8'));
  const filtered = list.filter((v) => v !== series);
  if (filtered.length !== list.length) {
    writeFileSync(versionsJsonPath, `${JSON.stringify(filtered, null, 2)}\n`);
  }
}

console.log(`[snapshot-docs] (re)snapshotting docs for ${series} (release ${next})`);
const result = spawnSync(
  'pnpm',
  ['--filter', '@unpunnyfuns/swatchbook-docs', 'exec', 'docusaurus', 'docs:version', series],
  { cwd: repoRoot, stdio: 'inherit' },
);
process.exit(result.status ?? 1);
