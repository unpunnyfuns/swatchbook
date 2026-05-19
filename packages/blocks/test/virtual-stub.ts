/**
 * Empty stand-in for `virtual:swatchbook/tokens`. The provider-first path
 * exercised in tests never reads these exports; the stub just lets
 * `#/internal/use-project.ts`'s module-level imports resolve when no
 * addon Vite plugin is in the pipeline.
 */
export const axes = [] as const;
export const disabledAxes = [] as const;
export const presets = [] as const;
export const diagnostics = [] as const;
export const css = '';
export const cssVarPrefix = '';
export const listing = {} as const;
export const defaultTuple = {} as const;
export const tokenGraph: {
  nodes: Record<string, unknown>;
  axes: readonly string[];
  axisDefaults: Record<string, string>;
  axisContexts: Record<string, readonly string[]>;
} = {
  nodes: {},
  axes: [],
  axisDefaults: {},
  axisContexts: {},
};
