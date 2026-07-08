#!/usr/bin/env node
// Snapshot the docusaurus docs/ tree under versioned_docs/version-<MAJOR.MINOR>/
// on every release. Pre-1.0 the docs site keeps **one stable snapshot + the
// current `docs/` tree** — every release drops the previous snapshot, the
// previous sidebars file, and the previous versions.json entries before
// `docusaurus docs:version` writes the new one. Visitors land on the latest
// stable at `/` and the in-flight main-branch docs at `/next/`; nothing older
// is preserved because pre-1.0 minors carry breaking changes and the older
// snapshots become misleading faster than they stay useful.
//
// Runs from the root `version` script (after `changeset version` has bumped
// workspace package.json versions), so the snapshot lands in the same
// "Version Packages" PR that Changesets opens.
//
// Prerelease versions (e.g. `1.0.0-alpha.N`) skip snapshotting entirely — see
// `snapshotPlan` — so the stable snapshot on `/` stays frozen while a prerelease
// channel is open; only `/next/` (the live `docs/` tree) moves.

import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

/**
 * Decide what the docs snapshot step should do for a given core version.
 * Prerelease versions (e.g. `1.0.0-alpha.3`) skip snapshotting: during a
 * prerelease channel the stable snapshot on `/` stays frozen and only
 * `/next/` (the live `docs/` tree) moves. Non-prerelease versions snapshot
 * under `version-<major>.<minor>`.
 */
export function snapshotPlan(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/);
  if (!match) return { action: 'error', message: `unexpected core version: ${version}` };
  if (match[4])
    return { action: 'skip', message: `prerelease ${version} — docs snapshot left unchanged` };
  return { action: 'snapshot', series: `${match[1]}.${match[2]}` };
}

function main() {
  const next = JSON.parse(
    readFileSync(join(repoRoot, 'packages/core/package.json'), 'utf8'),
  ).version;

  const plan = snapshotPlan(next);
  if (plan.action === 'error') {
    console.error(`[snapshot-docs] ${plan.message}`);
    process.exit(1);
  }
  if (plan.action === 'skip') {
    console.log(`[snapshot-docs] ${plan.message}`);
    process.exit(0);
  }
  const series = plan.series;

  const versionedDocsRoot = join(repoRoot, 'apps/docs/versioned_docs');
  const versionedSidebarsRoot = join(repoRoot, 'apps/docs/versioned_sidebars');
  const versionsJsonPath = join(repoRoot, 'apps/docs/versions.json');

  // Drop every existing versioned_docs/ snapshot and matching sidebar file —
  // docusaurus docs:version below will write the current release's snapshot
  // fresh. Pre-1.0 single-stable policy: only the just-built snapshot survives
  // on disk. Idempotent + safe to re-run.
  if (existsSync(versionedDocsRoot)) {
    for (const entry of readdirSync(versionedDocsRoot)) {
      if (entry.startsWith('version-')) {
        rmSync(join(versionedDocsRoot, entry), { recursive: true, force: true });
      }
    }
  }
  if (existsSync(versionedSidebarsRoot)) {
    for (const entry of readdirSync(versionedSidebarsRoot)) {
      if (entry.startsWith('version-') && entry.endsWith('-sidebars.json')) {
        rmSync(join(versionedSidebarsRoot, entry), { force: true });
      }
    }
  }
  // Reset versions.json so `docusaurus docs:version` writes a clean single-entry
  // list. Without the reset it would prepend, accumulating prior entries that
  // no longer have snapshots on disk.
  writeFileSync(versionsJsonPath, '[]\n');

  console.log(`[snapshot-docs] snapshotting docs for ${series} (release ${next})`);
  const result = spawnSync(
    'pnpm',
    ['--filter', '@unpunnyfuns/swatchbook-docs', 'exec', 'docusaurus', 'docs:version', series],
    { cwd: repoRoot, stdio: 'inherit' },
  );
  process.exit(result.status ?? 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
