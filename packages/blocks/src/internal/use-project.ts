import { useEffect, useState } from 'react';
import { addons } from 'storybook/preview-api';
import { useActiveAxes, useActiveTheme } from '@unpunnyfuns/swatchbook-addon/hooks';
import {
  axes as virtualAxes,
  css as generatedCss,
  cssVarPrefix,
  defaultTheme,
  themes,
  themesResolved,
} from 'virtual:swatchbook/tokens';

type VirtualTokens = typeof themesResolved;
type ResolvedTokens = VirtualTokens[string];
type VirtualAxes = typeof virtualAxes;

export interface ProjectData {
  activeTheme: string;
  activeAxes: Record<string, string>;
  axes: VirtualAxes;
  themes: typeof themes;
  resolved: ResolvedTokens;
  themesResolved: VirtualTokens;
  cssVarPrefix: string;
}

const STYLE_ELEMENT_ID = 'swatchbook-tokens';
const GLOBAL_KEY = 'swatchbookTheme';
const AXES_GLOBAL_KEY = 'swatchbookAxes';

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

interface GlobalsPayload {
  globals?: Record<string, unknown>;
}

function defaultTuple(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of virtualAxes) out[axis.name] = axis.default;
  return out;
}

function tupleForName(name: string): Record<string, string> | undefined {
  const match = themes.find((t) => t.name === name);
  return match?.input;
}

function tuplesEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function nameForTuple(tuple: Record<string, string>): string | undefined {
  const match = themes.find((t) => tuplesEqual(t.input as Record<string, string>, tuple));
  return match?.name;
}

/**
 * One-stop hook for block components. Self-mounts the virtual module's
 * per-theme CSS (so blocks work in MDX/autodocs, not just inside a story
 * where the addon's decorator runs) and tracks the active tuple via
 * Storybook's `globalsUpdated` channel event.
 *
 * Can't use `useGlobals` from `storybook/preview-api` — that's a story
 * hook that throws "Storybook preview hooks can only be called inside
 * decorators and story functions" when called from MDX doc blocks.
 */
export function useProject(): ProjectData {
  const contextTheme = useActiveTheme();
  const contextAxes = useActiveAxes();
  const [channelTheme, setChannelTheme] = useState<string | null>(null);
  const [channelAxes, setChannelAxes] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    ensureStylesheet();
  }, []);

  useEffect(() => {
    const channel = addons.getChannel();
    const onGlobals = (payload: GlobalsPayload): void => {
      const nextTheme = payload.globals?.[GLOBAL_KEY];
      if (typeof nextTheme === 'string') setChannelTheme(nextTheme);
      const nextAxes = payload.globals?.[AXES_GLOBAL_KEY];
      if (nextAxes && typeof nextAxes === 'object') {
        setChannelAxes(nextAxes as Record<string, string>);
      }
    };
    channel.on('globalsUpdated', onGlobals);
    channel.on('updateGlobals', onGlobals);
    return () => {
      channel.off('globalsUpdated', onGlobals);
      channel.off('updateGlobals', onGlobals);
    };
  }, []);

  const hasContextAxes = Object.keys(contextAxes).length > 0;
  const activeAxes: Record<string, string> = hasContextAxes
    ? { ...contextAxes }
    : (channelAxes ?? defaultTuple());

  const derivedName = nameForTuple(activeAxes);
  const fallbackTupleName = channelTheme && tupleForName(channelTheme) ? channelTheme : null;
  const activeTheme =
    contextTheme ||
    derivedName ||
    fallbackTupleName ||
    channelTheme ||
    defaultTheme ||
    themes[0]?.name ||
    '';

  return {
    activeTheme,
    activeAxes,
    axes: virtualAxes,
    themes,
    themesResolved,
    resolved: themesResolved[activeTheme] ?? {},
    cssVarPrefix,
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
