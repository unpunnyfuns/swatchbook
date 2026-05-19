// Internal helpers shared across token-graph modules. Not part of the /graph public surface.
export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
