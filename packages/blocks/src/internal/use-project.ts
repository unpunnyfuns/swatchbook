import { useEffect } from 'react';
import { useGlobals } from 'storybook/preview-api';
import { useActiveTheme } from '@unpunnyfuns/swatchbook-addon/hooks';
import {
  css as generatedCss,
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

const STYLE_ELEMENT_ID = 'swatchbook-tokens';
const GLOBAL_KEY = 'swatchbookTheme';

function ensureStylesheet(): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== generatedCss) style.textContent = generatedCss;
}

/**
 * One-stop hook for block components. Self-mounts the virtual module's
 * per-theme CSS (so blocks work in MDX/autodocs, not just inside a story
 * where the addon's decorator runs) and tracks the active theme from
 * either the addon's `ThemeContext` (set by the preview decorator) or
 * Storybook's preview globals (works in MDX where no decorator runs).
 */
export function useProject(): ProjectData {
  const contextTheme = useActiveTheme();
  const [globals] = useGlobals();
  const globalsTheme = globals[GLOBAL_KEY];

  useEffect(() => {
    ensureStylesheet();
  }, []);

  const activeTheme =
    contextTheme ||
    (typeof globalsTheme === 'string' ? globalsTheme : '') ||
    defaultTheme ||
    themes[0]?.name ||
    '';

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
