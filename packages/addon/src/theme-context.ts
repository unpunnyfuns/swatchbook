import { createContext, useContext } from 'react';

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
