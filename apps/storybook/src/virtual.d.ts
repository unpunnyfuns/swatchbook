/**
 * Type declarations for addon-served virtual modules. Swatchbook's Vite
 * plugin resolves these at request time; Storybook's preview imports
 * them directly from stories.
 */

declare module 'virtual:swatchbook/theme' {
  // Exact shape is derived from the loaded project at runtime. Consumers
  // either opt into precise types via codegen or accept the `unknown`
  // fall-through; for our dogfood story the narrow return shape here is
  // enough.
  export const theme: Readonly<Record<string, unknown>>;
  export const color: Readonly<Record<string, unknown>>;
  export const space: Readonly<Record<string, string>>;
  export const radius: Readonly<Record<string, string>>;
  export const shadow: Readonly<Record<string, string>>;
  export const typography: Readonly<Record<string, unknown>>;
}

/**
 * The addon's Vite plugin serves this module from
 * `snapshotForWire(project, css)`, emitting each `SnapshotForWire` field
 * as a named export; mirror that shape from the public core type so the
 * declaration can't drift from what the plugin actually emits.
 */
declare module 'virtual:swatchbook/tokens' {
  import type { SnapshotForWire } from '@unpunnyfuns/swatchbook-core/snapshot-for-wire';

  export const axes: SnapshotForWire['axes'];
  export const disabledAxes: SnapshotForWire['disabledAxes'];
  export const presets: SnapshotForWire['presets'];
  export const diagnostics: SnapshotForWire['diagnostics'];
  export const css: SnapshotForWire['css'];
  export const cssVarPrefix: SnapshotForWire['cssVarPrefix'];
  export const defaultColorFormat: SnapshotForWire['defaultColorFormat'];
  export const indicators: SnapshotForWire['indicators'];
  export const listing: SnapshotForWire['listing'];
  export const defaultTuple: SnapshotForWire['defaultTuple'];
  export const tokenGraph: SnapshotForWire['tokenGraph'];
}

declare module 'virtual:swatchbook/tailwind.css';
