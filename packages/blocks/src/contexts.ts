import { createContext, useContext } from 'react';

/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module, duplicated
 * as value-importable interfaces so consumers outside the addon's Vite
 * plugin (unit tests, custom React apps) can construct a snapshot by hand.
 *
 * The ambient `declare module 'virtual:swatchbook/tokens'` declarations in
 * `packages/addon/src/virtual.d.ts` describe the same payload; the two
 * stay in sync by eye.
 */
export interface VirtualAxisShape {
  name: string;
  contexts: readonly string[];
  default: string;
  description?: string;
  source: 'resolver' | 'synthetic';
}

export interface VirtualThemeShape {
  name: string;
  input: Record<string, string>;
  sources: string[];
}

export interface VirtualDiagnosticShape {
  severity: 'error' | 'warn' | 'info';
  group: string;
  message: string;
  filename?: string;
  line?: number;
  column?: number;
}

export interface VirtualTokenShape {
  $type?: string;
  $value?: unknown;
  $description?: string;
  aliasOf?: string;
  aliasChain?: readonly string[];
  aliasedBy?: readonly string[];
}

export interface VirtualPresetShape {
  name: string;
  axes: Partial<Record<string, string>>;
  description?: string;
}

/**
 * Full project data read by blocks. Populated by the addon's preview
 * decorator (from the virtual module) or constructed by hand in
 * non-Storybook consumers.
 */
export interface ProjectSnapshot {
  axes: readonly VirtualAxisShape[];
  presets: readonly VirtualPresetShape[];
  themes: readonly VirtualThemeShape[];
  themesResolved: Record<string, Record<string, VirtualTokenShape>>;
  activeTheme: string;
  activeAxes: Readonly<Record<string, string>>;
  cssVarPrefix: string;
  diagnostics: readonly VirtualDiagnosticShape[];
  css: string;
}

/**
 * Context carrying the full {@link ProjectSnapshot}. `null` sentinel lets
 * `useSwatchbookData()` tell "provider present" from "fall back to the
 * virtual module".
 */
export const SwatchbookContext = createContext<ProjectSnapshot | null>(null);

export function useOptionalSwatchbookData(): ProjectSnapshot | null {
  return useContext(SwatchbookContext);
}

/**
 * Active swatchbook theme for the current story/docs render. Populated by
 * the addon's preview decorator and consumed by `useToken` + any future
 * consumer hooks.
 *
 * This runs through plain React context rather than Storybook's
 * `useGlobals` so the same hook works in autodocs / MDX renders where the
 * preview-hooks context isn't available.
 */
export const ThemeContext = createContext<string>('');

export function useActiveTheme(): string {
  return useContext(ThemeContext);
}

/**
 * Active axis tuple for the current story/docs render — `Record<axisName,
 * contextName>`. Derived from the same input as {@link ThemeContext}; split
 * out so consumers needing per-axis info (toolbar, panel, tuple-aware
 * blocks) don't have to reparse the composed permutation ID.
 */
export const AxesContext = createContext<Readonly<Record<string, string>>>({});

export function useActiveAxes(): Readonly<Record<string, string>> {
  return useContext(AxesContext);
}
