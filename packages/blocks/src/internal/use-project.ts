import { makeCSSVar } from '@terrazzo/token-tools/css';
import { useEffect } from 'react';
import type { VirtualTokenListingShape } from '#/contexts.ts';
import { useActiveAxes, useActiveTheme, useOptionalSwatchbookData } from '#/contexts.ts';
import { useChannelGlobals } from '#/internal/channel-globals.ts';
import { useTokenSnapshot } from '#/internal/channel-tokens.ts';
import type {
  ProjectSnapshot,
  VirtualAxis,
  VirtualDiagnostic,
  VirtualTheme,
  VirtualToken,
} from '#/types.ts';

type ResolvedTokens = Record<string, VirtualToken>;

export interface ProjectData {
  activeTheme: string;
  activeAxes: Record<string, string>;
  axes: readonly VirtualAxis[];
  themes: readonly VirtualTheme[];
  resolved: ResolvedTokens;
  themesResolved: Record<string, ResolvedTokens>;
  diagnostics: readonly VirtualDiagnostic[];
  cssVarPrefix: string;
  /**
   * Path-indexed Token Listing data. Empty when absent (non-resolver
   * projects, hand-built snapshots that don't populate it). Blocks read
   * authoritative CSS var names from `listing[path].names.css` and
   * preview strings from `listing[path].previewValue`.
   */
  listing: Readonly<Record<string, VirtualTokenListingShape>>;
}

const STYLE_ELEMENT_ID = 'swatchbook-tokens';

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
    diagnostics: snapshot.diagnostics,
    cssVarPrefix: snapshot.cssVarPrefix,
    listing: snapshot.listing ?? {},
  };
}

/**
 * Reads project data either from a mounted {@link SwatchbookProvider}
 * (preferred — the addon's preview decorator installs one around every
 * story) or, when no provider is present, from the virtual module plus
 * Storybook globals directly.
 *
 * The provider-less path is what makes the hook safe to call from MDX
 * doc blocks and autodocs renders where no story is active. It
 * self-mounts the virtual module's per-theme CSS and tracks the active
 * tuple via the `globalsUpdated` channel event; {@link useGlobals} from
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
  const channelGlobals = useChannelGlobals();
  /**
   * Subscribe to the live token snapshot rather than reading the virtual
   * module's module-level exports directly. Initial values come from
   * `virtual:swatchbook/tokens` at load time; subsequent dev-time edits
   * flow through the addon's HMR channel and update this snapshot in
   * place so blocks re-render without a full preview reload.
   */
  const tokens = useTokenSnapshot();

  useEffect(() => {
    if (!enabled) return;
    ensureStylesheet(tokens.css);
  }, [enabled, tokens.css]);

  const hasContextAxes = Object.keys(contextAxes).length > 0;
  const activeAxes: Record<string, string> = hasContextAxes
    ? { ...contextAxes }
    : (channelGlobals.axes ?? defaultTuple(tokens.axes));

  const derivedName = nameForTuple(tokens.themes, activeAxes);
  const channelTheme = channelGlobals.theme;
  const fallbackTupleName =
    channelTheme && tupleForName(tokens.themes, channelTheme) ? channelTheme : null;
  const activeTheme =
    contextTheme ||
    derivedName ||
    fallbackTupleName ||
    channelTheme ||
    tokens.defaultTheme ||
    tokens.themes[0]?.name ||
    '';

  return {
    activeTheme,
    activeAxes,
    axes: tokens.axes,
    themes: tokens.themes,
    themesResolved: tokens.themesResolved,
    resolved: tokens.themesResolved[activeTheme] ?? {},
    diagnostics: tokens.diagnostics,
    cssVarPrefix: tokens.cssVarPrefix,
    listing: tokens.listing,
  };
}

/**
 * Thin wrapper around Terrazzo's `makeCSSVar` so the block-display surface
 * and `packages/core/src/css.ts`'s emitter share one implementation. Any
 * future naming-policy shift in Terrazzo (casing, unicode, prefix handling)
 * reaches both surfaces at once instead of needing a parallel update here.
 */
export function makeCssVar(path: string, prefix: string): string {
  return prefix ? makeCSSVar(path, { prefix, wrapVar: true }) : makeCSSVar(path, { wrapVar: true });
}

/**
 * Resolve a token's CSS var reference, preferring the authoritative name
 * emitted by `@terrazzo/plugin-css` (as recorded by
 * `@terrazzo/plugin-token-listing` in the snapshot's `listing` field).
 * Falls back to `makeCssVar` when the listing lacks an entry for this
 * path — covers non-resolver projects, hand-built snapshots, and any
 * listing-plugin miss.
 */
export function resolveCssVar(path: string, project: ProjectData): string {
  const listed = project.listing[path]?.names?.['css'];
  if (listed) return `var(${listed})`;
  return makeCssVar(path, project.cssVarPrefix);
}

/**
 * Match a dot-separated DTCG token path against a block `filter` prop.
 *
 * **Supported shapes** (the narrow subset we need — DTCG paths don't have
 * directories, brace expansion, or regex, so we skip a full glob engine):
 *
 * | Pattern            | Matches                                             |
 * | ------------------ | --------------------------------------------------- |
 * | `undefined` / `''` | everything                                          |
 * | `*` or `**`        | everything                                          |
 * | `color`            | exact path `color`, or any descendant `color.*`     |
 * | `color.*`      | any path whose fixed prefix is `color.`         |
 * | `color**`          | any path starting with `color`                      |
 *
 * Not supported (all pass through as literal segment matchers): brace
 * expansion (`{a,b}`), mid-path globs (`color.*.bg`), negation (`!foo`),
 * character classes (`[sys]`). If you hit those, pre-filter by hand.
 */
export function globMatch(path: string, glob: string | undefined): boolean {
  if (!glob) return true;
  if (glob === '*' || glob === '**') return true;
  if (glob.endsWith('.*')) return path.startsWith(`${glob.slice(0, -2)}.`);
  if (glob.endsWith('**')) return path.startsWith(glob.slice(0, -2));
  return path === glob || path.startsWith(`${glob}.`);
}
