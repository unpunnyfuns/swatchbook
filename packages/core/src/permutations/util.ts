import { globSync } from 'node:fs';
import { isAbsolute, resolve as resolvePath } from 'node:path';
import type { Axis, Diagnostic } from '#/types.ts';

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

/**
 * Hard cap on the cartesian-product permutation count loaded eagerly.
 * Resolver-driven projects fan out modifiers into a product space; some
 * authors use modifiers for state-space (locale × density × motion-pref
 * × …) where the cartesian is enormous but only a handful of tuples are
 * presentational. The guard keeps `loadProject` from OOMing on those —
 * see terrazzo#752 for the upstream case (15M permutations).
 */
export const DEFAULT_MAX_PERMUTATIONS = 1024;

/**
 * Compute the cartesian-product size from a list of axes without
 * allocating tuples. `axis.contexts` of length 0 counts as 1 (a no-op
 * modifier doesn't multiply the space).
 */
export function cartesianSize(axes: readonly Axis[]): number {
  let n = 1;
  for (const axis of axes) n *= Math.max(1, axis.contexts.length);
  return n;
}

/**
 * Build a `swatchbook/permutations` warn diagnostic for the
 * threshold-exceeded case.
 */
export function permutationGuardDiagnostic(size: number, limit: number): Diagnostic {
  return {
    severity: 'warn',
    group: 'swatchbook/permutations',
    message: `Project has ${size.toLocaleString()} cartesian permutations — exceeds the \`maxPermutations\` guard (${limit.toLocaleString()}). Loaded only the default permutation. Author \`presets\` for curated tuples, set \`disabledAxes\` to pin state-space modifiers, or raise \`maxPermutations\` if the full enumeration is needed.`,
  };
}
