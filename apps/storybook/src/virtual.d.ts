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

declare module 'virtual:swatchbook/tailwind.css';
