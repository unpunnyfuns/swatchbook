import type { VirtualToken } from '#/types.ts';

/**
 * Build a `resolveAt` function from a flat token map. Used in test
 * snapshot factories to supply a working `resolveAt` that returns the
 * same tokens for every tuple (single-context test snapshots only need
 * one resolved view).
 */
export function makeResolveAt(
  tokens: Record<string, VirtualToken>,
): (tuple: Record<string, string>) => Record<string, VirtualToken> {
  return (_tuple) => tokens;
}
