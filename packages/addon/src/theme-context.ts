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
