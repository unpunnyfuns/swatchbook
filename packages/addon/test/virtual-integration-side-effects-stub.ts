/**
 * No-op stand-in for `virtual:swatchbook/integration-side-effects`.
 *
 * The real virtual module's side-effect-only `import` is satisfied by a
 * file that exports nothing — vitest needs an actual module to resolve,
 * but it doesn't need to do anything. The dummy export below keeps
 * linters that flag empty files happy without changing behavior.
 */
export const integrationSideEffectsStub = true;
