import { useEffect, useState } from 'react';
import { addons } from 'storybook/preview-api';
import { useActiveAxes, useActiveTheme, useOptionalSwatchbookData } from '#/contexts.ts';
import {
  axes as virtualAxes,
  css as generatedCss,
  cssVarPrefix,
  defaultTheme,
  themes,
  themesResolved,
} from 'virtual:swatchbook/tokens';
import type { ProjectSnapshot, VirtualAxis, VirtualTheme, VirtualToken } from '#/types.ts';

type ResolvedTokens = Record<string, VirtualToken>;

export interface ProjectData {
  activeTheme: string;
  activeAxes: Record<string, string>;
  axes: readonly VirtualAxis[];
  themes: readonly VirtualTheme[];
  resolved: ResolvedTokens;
  themesResolved: Record<string, ResolvedTokens>;
  cssVarPrefix: string;
}

const STYLE_ELEMENT_ID = 'swatchbook-tokens';
const GLOBAL_KEY = 'swatchbookTheme';
const AXES_GLOBAL_KEY = 'swatchbookAxes';

function ensureStylesheet(css: string): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

interface GlobalsPayload {
  globals?: Record<string, unknown>;
}

function defaultTuple(axes: readonly VirtualAxis[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) out[axis.name] = axis.default;
  return out;
}

function tupleForName(
  themesList: readonly VirtualTheme[],
  name: string,
): Record<string, string> | undefined {
  const match = themesList.find((t) => t.name === name);
  return match?.input;
}

function tuplesEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function nameForTuple(
  themesList: readonly VirtualTheme[],
  tuple: Record<string, string>,
): string | undefined {
  const match = themesList.find((t) => tuplesEqual(t.input as Record<string, string>, tuple));
  return match?.name;
}

function snapshotToData(snapshot: ProjectSnapshot): ProjectData {
  return {
    activeTheme: snapshot.activeTheme,
    activeAxes: { ...snapshot.activeAxes },
    axes: snapshot.axes,
    themes: snapshot.themes,
    themesResolved: snapshot.themesResolved,
    resolved: snapshot.themesResolved[snapshot.activeTheme] ?? {},
    cssVarPrefix: snapshot.cssVarPrefix,
  };
}

/**
 * Reads project data either from a mounted {@link SwatchbookProvider}
 * (preferred — the addon's preview decorator installs one around every
 * story) or — as a back-compat fallback — directly from the virtual
 * module plus Storybook globals.
 *
 * The fallback path is what makes the hook safe to call from MDX doc
 * blocks and autodocs renders where no story is active. It self-mounts
 * the virtual module's per-theme CSS and tracks the active tuple via the
 * `globalsUpdated` channel event; {@link useGlobals} from
 * `storybook/preview-api` would throw outside a story render.
 */
export function useProject(): ProjectData {
  const snapshot = useOptionalSwatchbookData();
  const fallback = useVirtualModuleFallback(snapshot === null);
  return snapshot !== null ? snapshotToData(snapshot) : fallback;
}

function useVirtualModuleFallback(enabled: boolean): ProjectData {
  const contextTheme = useActiveTheme();
  const contextAxes = useActiveAxes();
  const [channelTheme, setChannelTheme] = useState<string | null>(null);
  const [channelAxes, setChannelAxes] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    ensureStylesheet(generatedCss);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
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
    channel.on('setGlobals', onGlobals);
    return () => {
      channel.off('globalsUpdated', onGlobals);
      channel.off('updateGlobals', onGlobals);
      channel.off('setGlobals', onGlobals);
    };
  }, [enabled]);

  const hasContextAxes = Object.keys(contextAxes).length > 0;
  const activeAxes: Record<string, string> = hasContextAxes
    ? { ...contextAxes }
    : (channelAxes ?? defaultTuple(virtualAxes));

  const derivedName = nameForTuple(themes, activeAxes);
  const fallbackTupleName =
    channelTheme && tupleForName(themes, channelTheme) ? channelTheme : null;
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
