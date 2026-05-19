import type { VirtualTokenShape } from '#/contexts.ts';

/**
 * Build a `resolveAt` function from a flat token map. Used in test
 * snapshot factories to supply a working `resolveAt` that returns the
 * same tokens for every tuple (single-context test snapshots only need
 * one resolved view).
 */
export function makeResolveAt(
  tokens: Record<string, VirtualTokenShape>,
): (tuple: Record<string, string>) => Record<string, VirtualTokenShape> {
  return (_tuple) => tokens;
}
