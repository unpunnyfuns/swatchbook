import { useActiveTheme } from '@unpunnyfuns/swatchbook-addon/hooks';
import {
  cssVarPrefix,
  defaultTheme,
  themes,
  themesResolved,
  themingMode,
} from 'virtual:swatchbook/tokens';

type VirtualTokens = typeof themesResolved;
type ResolvedTokens = VirtualTokens[string];

export interface ProjectData {
  activeTheme: string;
  themes: typeof themes;
  resolved: ResolvedTokens;
  themesResolved: VirtualTokens;
  cssVarPrefix: string;
  mode: 'layered' | 'resolver' | 'manifest';
}

/**
 * One-stop hook for block components. Reads the active theme from the
 * addon's `ThemeContext`, returns the full project snapshot plus a
 * convenience `resolved` map for that theme.
 */
export function useProject(): ProjectData {
  const contextTheme = useActiveTheme();
  const activeTheme = contextTheme || (defaultTheme ?? themes[0]?.name ?? '');
  return {
    activeTheme,
    themes,
    themesResolved,
    resolved: themesResolved[activeTheme] ?? {},
    cssVarPrefix,
    mode: themingMode,
  };
}

export function makeCssVar(path: string, prefix: string): string {
  const tail = path.replaceAll('.', '-');
  return prefix ? `var(--${prefix}-${tail})` : `var(--${tail})`;
}

export function globMatch(path: string, glob: string | undefined): boolean {
  if (!glob) return true;
  if (glob === '*' || glob === '**') return true;
  // Accept simple `prefix.*` patterns plus exact matches.
  if (glob.endsWith('.*')) return path.startsWith(`${glob.slice(0, -2)}.`);
  if (glob.endsWith('**')) return path.startsWith(glob.slice(0, -2));
  return path === glob || path.startsWith(`${glob}.`);
}

export function formatValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v['hex'] === 'string') return v['hex'] as string;
    if ('value' in v && 'unit' in v) return `${String(v['value'])}${String(v['unit'])}`;
    return JSON.stringify(value).slice(0, 120);
  }
  return String(value);
}
