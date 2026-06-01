/// <reference types="vite/client" />
import { resolveAllAt } from '@unpunnyfuns/swatchbook-core/graph';
import type { TokenMap } from '@unpunnyfuns/swatchbook-core';
import type { Decorator, Preview } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { addons } from 'storybook/preview-api';
import { dataAttr } from '@unpunnyfuns/swatchbook-core/data-attr';
import { ensureStyleElement } from '@unpunnyfuns/swatchbook-core/style-element';
import { tupleToName } from '@unpunnyfuns/swatchbook-core/themes';
// Side-effect import for integrations that opted into `autoInject`
// (e.g. Tailwind's `@theme` block). When no integration opts in, the
// virtual module body is empty — still a valid no-op.
import 'virtual:swatchbook/integration-side-effects';
import {
  axes as virtualAxes,
  css,
  cssVarPrefix,
  defaultTuple as virtualDefaultTuple,
  diagnostics,
  disabledAxes as virtualDisabledAxes,
  listing as virtualListing,
  presets as virtualPresets,
  tokenGraph as virtualTokenGraph,
} from 'virtual:swatchbook/tokens';
import {
  AxesContext,
  COLOR_FORMATS,
  ColorFormatContext,
  SwatchbookContext,
  ThemeContext,
} from '@unpunnyfuns/swatchbook-blocks';
import type { ColorFormat, ProjectSnapshot } from '@unpunnyfuns/swatchbook-blocks';
import {
  AXES_GLOBAL_KEY,
  COLOR_FORMAT_GLOBAL_KEY,
  HMR_EVENT,
  INIT_EVENT,
  INIT_REQUEST_EVENT,
  PREVIEW_MOUSEDOWN_EVENT,
  STYLE_ELEMENT_ID,
  TOKENS_UPDATED_EVENT,
} from '#/constants.ts';
import type { InitPayload } from '#/channel-types.ts';
import type { StoryParameters, SwatchbookGlobals } from '#/globals.ts';

// Standard visually-hidden style for the theme-flip live region.
// Keeps the announcement element discoverable by SR but out of visual
// + pointer flow. The clip-path / `position: absolute` combination is
// the canonical sr-only pattern.
const SR_ONLY_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// The `html, body { ... }` rules that paint the iframe's own chrome
// (outside any decorator wrapper — Docs mode, autodocs, empty gutters)
// with the active theme's surface + text vars. Composed alongside the
// emitted token CSS so both load through the same `<style>` element.
function iframeChromeRules(prefix: string): string {
  const surface = prefix ? `--${prefix}-color-surface-default` : '--color-surface-default';
  const text = prefix ? `--${prefix}-color-text-default` : '--color-text-default';
  return `
html, body {
  background: var(${surface}, Canvas);
  color: var(${text}, CanvasText);
  margin: 0;
}
`;
}

// Inject the per-theme stylesheet plus the iframe-chrome block. Shared
// with the HMR re-emit path below so a token refresh updates the
// iframe's chrome rules from the same source.
function ensureStylesheet(cssText: string, prefix: string): void {
  ensureStyleElement(STYLE_ELEMENT_ID, `${cssText}\n${iframeChromeRules(prefix)}`);
}

// Apply `cb(axisName, value)` for every pinned (disabled) axis whose
// default-tuple value is set. `virtualDefaultTuple` carries the
// post-filter axis defaults; disabled axes don't appear in
// `virtualAxes` but their pinned context value still lives here, so
// sampling it yields each pinned axis's active context.
function forEachPinnedAxis(cb: (name: string, value: string) => void): void {
  for (const name of virtualDisabledAxes) {
    const value = virtualDefaultTuple[name];
    if (value !== undefined) cb(name, value);
  }
}

// Compose a stable theme name from a tuple — `axisValues.join(' · ')`
// in axis order. Used for the `ThemeContext` value the blocks read and
// the addon-channel signals downstream consumers subscribe to. Returns
// empty string when there are no axes (no name to write).
function composeThemeName(tuple: Readonly<Record<string, string>>): string {
  if (virtualAxes.length === 0) return '';
  return tupleToName(virtualAxes, tuple);
}

// Write one `data-<prefix>-<axis>=<context>` per axis on `<html>`.
// The smart CSS emitter targets these single-axis selectors (and
// joint compounds across multiple) — that's the actual scoping
// surface the cascade resolves through. Prefix follows `cssVarPrefix`
// so attr namespace and emitted selectors stay in lockstep.
function setRootAxes(tuple: Readonly<Record<string, string>>): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const axis of virtualAxes) {
    const attr = dataAttr(cssVarPrefix, axis.name);
    const value = tuple[axis.name];
    if (value === undefined) {
      root.removeAttribute(attr);
    } else {
      root.setAttribute(attr, value);
    }
  }
  forEachPinnedAxis((name, value) => {
    root.setAttribute(dataAttr(cssVarPrefix, name), value);
  });
}

// Project the INIT_EVENT fields the manager bundle needs out of a wider
// source object. Both `broadcastInit` (module-level virtual exports) and
// the HMR re-emit (`payload`-shaped) feed it, so the two compose the same
// `InitPayload` from the same field set.
function toInitPayload(source: InitPayload): InitPayload {
  return {
    axes: source.axes,
    disabledAxes: source.disabledAxes,
    presets: source.presets,
    diagnostics: source.diagnostics,
    cssVarPrefix: source.cssVarPrefix,
    defaultTuple: source.defaultTuple,
  };
}

// Emit the full virtual-module payload to the manager over Storybook's
// channel so the toolbar + panel (which run in the manager bundle and
// can't import our virtual module) can render from it.
function broadcastInit(): void {
  const channel = addons.getChannel();
  channel.emit(
    INIT_EVENT,
    toInitPayload({
      axes: virtualAxes,
      disabledAxes: virtualDisabledAxes,
      presets: virtualPresets,
      diagnostics,
      cssVarPrefix,
      defaultTuple: virtualDefaultTuple,
    }),
  );
}

// Axis-default tuple, used as the baseline before overrides.
function defaultTuple(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of virtualAxes) out[axis.name] = axis.default;
  return out;
}

// Reverse-engineer a tuple from a `Light · Brand A · Normal`-shape
// theme name. Splits on ` · ` and zips with `virtualAxes` in declared
// order — matches `composeThemeName`'s production direction so a
// round-trip is lossless. Returns `undefined` when the segment count
// doesn't match the axis count.
function tupleForName(name: string): Record<string, string> | undefined {
  if (!name) return undefined;
  const parts = name.split(' · ');
  if (parts.length !== virtualAxes.length) return undefined;
  const out: Record<string, string> = {};
  for (let i = 0; i < virtualAxes.length; i++) {
    const axis = virtualAxes[i] as (typeof virtualAxes)[number];
    const value = parts[i];
    if (value === undefined) return undefined;
    out[axis.name] = value;
  }
  return out;
}

// Merge a partial tuple onto the axis defaults, dropping keys for axes that
// don't exist and silently falling back to the default for contexts that
// aren't listed on the axis.
function normalizeTuple(partial: Readonly<Record<string, string>>): Record<string, string> {
  const out = defaultTuple();
  for (const axis of virtualAxes) {
    const candidate = partial[axis.name];
    if (candidate !== undefined && axis.contexts.includes(candidate)) {
      out[axis.name] = candidate;
    }
  }
  return out;
}

// Resolve the active tuple from all input channels, in priority order:
//   1. `parameters.swatchbook.axes` — per-story tuple.
//   2. `parameters.swatchbook.permutation` — per-story composed theme name.
//   3. `globals.swatchbookAxes` — toolbar-set tuple.
//   4. virtual module default.
function resolveTuple(
  axesGlobal: SwatchbookGlobals[typeof AXES_GLOBAL_KEY],
  paramSwatchbook: StoryParameters['swatchbook'],
): Record<string, string> {
  const paramAxes = paramSwatchbook?.axes;
  if (paramAxes) {
    return normalizeTuple(paramAxes);
  }
  if (paramSwatchbook?.permutation) {
    const hit = tupleForName(paramSwatchbook.permutation);
    if (hit) return normalizeTuple(hit);
  }
  if (axesGlobal && typeof axesGlobal === 'object') {
    return normalizeTuple(axesGlobal as Record<string, string>);
  }
  return defaultTuple();
}

function resolveColorFormat(raw: SwatchbookGlobals[typeof COLOR_FORMAT_GLOBAL_KEY]): ColorFormat {
  if (typeof raw === 'string' && (COLOR_FORMATS as readonly string[]).includes(raw)) {
    return raw as ColorFormat;
  }
  return 'hex';
}

// Single shared `resolveAt` instance for the lifetime of the preview
// iframe. `virtualTokenGraph` is a module-level virtual-module export
// with stable identity, so this closure never needs to rebuild;
// downstream `ProjectSnapshot` consumers can key memos on the snapshot
// wrapper without worrying about `resolveAt` churning when Storybook
// recreates `context.globals`.
const previewResolveAt = (tuple: Record<string, string>): TokenMap =>
  resolveAllAt(virtualTokenGraph, tuple);

const themedDecorator: Decorator = (Story, context) => {
  const globals = context.globals as SwatchbookGlobals;
  const parameters = context.parameters as StoryParameters;
  const axesGlobal = globals[AXES_GLOBAL_KEY];
  const colorFormatGlobal = globals[COLOR_FORMAT_GLOBAL_KEY];
  const paramSwatchbook = parameters.swatchbook;
  const tuple = useMemo(
    () => resolveTuple(axesGlobal, paramSwatchbook),
    [axesGlobal, paramSwatchbook],
  );
  const colorFormat = useMemo(() => resolveColorFormat(colorFormatGlobal), [colorFormatGlobal]);
  const themeName = useMemo(() => composeThemeName(tuple), [tuple]);

  useEffect(() => {
    ensureStylesheet(css, cssVarPrefix);
    broadcastInit();
  }, []);

  useEffect(() => {
    setRootAxes(tuple);
  }, [tuple]);

  // Page-level live region announces theme/axis flips to SR users.
  // Initial mount stays silent (no spurious announcement on every story
  // load); subsequent `themeName` changes schedule a debounced update so
  // rapid axis flips (or per-story tuple overrides while paging through
  // a Storybook docs index) collapse into one announcement.
  const [announcement, setAnnouncement] = useState('');
  const initialThemeRef = useRef(themeName);
  useEffect(() => {
    if (themeName === initialThemeRef.current) return;
    const timer = setTimeout(() => {
      setAnnouncement(themeName ? `Theme: ${themeName}` : '');
    }, 250);
    return () => {
      clearTimeout(timer);
    };
  }, [themeName]);

  const wrapperAttrs: Record<string, string> = {};
  for (const axis of virtualAxes) {
    const value = tuple[axis.name];
    if (value !== undefined) wrapperAttrs[dataAttr(cssVarPrefix, axis.name)] = value;
  }
  forEachPinnedAxis((name, value) => {
    wrapperAttrs[dataAttr(cssVarPrefix, name)] = value;
  });

  const snapshot = useMemo<ProjectSnapshot>(
    () => ({
      axes: virtualAxes,
      disabledAxes: virtualDisabledAxes,
      presets: virtualPresets,
      activeTheme: themeName,
      activeAxes: tuple,
      cssVarPrefix,
      diagnostics,
      css,
      listing: virtualListing,
      tokenGraph: virtualTokenGraph,
      defaultTuple: virtualDefaultTuple,
      resolveAt: previewResolveAt,
    }),
    [themeName, tuple],
  );

  return (
    <SwatchbookContext.Provider value={snapshot}>
      <ThemeContext.Provider value={themeName}>
        <AxesContext.Provider value={tuple}>
          <ColorFormatContext.Provider value={colorFormat}>
            <div
              {...wrapperAttrs}
              style={{
                padding: '1rem',
                minHeight: '100%',
              }}
            >
              <Story />
            </div>
            <div role="status" aria-live="polite" style={SR_ONLY_STYLE}>
              {announcement}
            </div>
          </ColorFormatContext.Provider>
        </AxesContext.Provider>
      </ThemeContext.Provider>
    </SwatchbookContext.Provider>
  );
};

/**
 * Named exports consumed by `definePreviewAddon(previewExports)` in the
 * addon's CSF Next factory (`src/index.ts`).
 */
export const decorators: NonNullable<Preview['decorators']> = [themedDecorator];

export const globalTypes: NonNullable<Preview['globalTypes']> = {
  [AXES_GLOBAL_KEY]: {
    name: 'Axes',
    description: 'Per-axis context selection — the active theme name tuple.',
  },
  [COLOR_FORMAT_GLOBAL_KEY]: {
    name: 'Color format',
    description: 'Display format for color tokens in blocks. Emitted CSS is unaffected.',
  },
};

function buildInitialAxes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of virtualAxes) out[axis.name] = axis.default;
  return out;
}

export const initialGlobals: NonNullable<Preview['initialGlobals']> = {
  [AXES_GLOBAL_KEY]: buildInitialAxes(),
  [COLOR_FORMAT_GLOBAL_KEY]: 'hex',
};

// Module-level channel subscription: writes the active tuple's attributes
// onto `<html>` regardless of whether a story decorator is rendering.
//
// The themedDecorator already sets these inside story renders, but it
// never runs on MDX docs pages that embed blocks without `<Story />`.
// Without attrs on an ancestor, the per-tuple CSS selectors
// (`[data-mode="Dark"][data-brand="…"]`) don't match and everything falls
// back to the `:root` default tuple — so colors stay defaults even after
// the toolbar switches axes. Subscribing globally fixes MDX docs at the
// cost of one idempotent redundant write per story render.
function installGlobalAxisApplier(): void {
  if (typeof document === 'undefined') return;
  const channel = addons.getChannel();
  // Inject the stylesheet and emit the init payload once on module load so
  // the manager's toolbar populates and CSS vars are available even when no
  // story/decorator ever runs (bare MDX docs pages). Without these, the
  // toolbar sits in its disabled "loading…" state and nothing is styled.
  ensureStylesheet(css, cssVarPrefix);
  broadcastInit();
  // If the manager subscribes to INIT_EVENT after our initial broadcast,
  // it misses the payload and the toolbar stays in its "loading…" state
  // until something else re-fires it. Honor an explicit request event so
  // a late-mounting manager can ask for the payload.
  channel.on(INIT_REQUEST_EVENT, broadcastInit);
  const apply = (globals: SwatchbookGlobals): void => {
    ensureStylesheet(css, cssVarPrefix);
    const tuple = resolveTuple(globals[AXES_GLOBAL_KEY], undefined);
    setRootAxes(tuple);
  };
  // Storybook fires `globalsUpdated`, `setGlobals`, and `updateGlobals`
  // for the same logical change (preview init + every toolbar tick).
  // Subscribing to all three is intentional — `setGlobals` carries the
  // initial URL-persisted globals; `updateGlobals` is the toolbar
  // signal; `globalsUpdated` is the cross-frame echo. Apply the same
  // handler to all three but dedupe via a stringified-tuple guard so
  // downstream `setRootAxes` + `useSyncExternalStore` consumers
  // re-render at most once per real change instead of three times per
  // tick.
  let lastApplied = '';
  const onGlobals = (payload: { globals?: SwatchbookGlobals }): void => {
    if (!payload.globals) return;
    const tuple = resolveTuple(payload.globals[AXES_GLOBAL_KEY], undefined);
    const themeKey = composeThemeName(tuple);
    if (themeKey === lastApplied) return;
    lastApplied = themeKey;
    apply(payload.globals);
  };
  channel.on('globalsUpdated', onGlobals);
  channel.on('setGlobals', onGlobals);
  channel.on('updateGlobals', onGlobals);
}

installGlobalAxisApplier();

// Bridge `mousedown` inside the preview iframe to the manager via a
// dedicated channel event. The toolbar popover's outside-click listener
// runs on the manager's document, which can't observe mousedowns inside
// the preview; without this bridge, clicking the canvas leaves the
// popover open. Idempotent: fires at most once per real mousedown.
function installPreviewMouseDownBridge(): void {
  if (typeof document === 'undefined') return;
  const channel = addons.getChannel();
  document.addEventListener('mousedown', () => {
    channel.emit(PREVIEW_MOUSEDOWN_EVENT);
  });
}

installPreviewMouseDownBridge();

// Wire the dev-time token-refresh HMR path. The plugin emits `HMR_EVENT`
// with the fresh virtual-module payload whenever a watched source file
// changes; we re-inject the stylesheet and forward to the Storybook
// channel so the toolbar re-renders and blocks can re-subscribe with
// the new snapshot — no full preview reload, so args / scroll / open
// overlays survive the refresh. No-ops in production where
// `import.meta.hot` is undefined.
interface HmrSnapshot {
  axes: typeof virtualAxes;
  disabledAxes: typeof virtualDisabledAxes;
  presets: typeof virtualPresets;
  diagnostics: typeof diagnostics;
  css: string;
  cssVarPrefix: string;
  listing: typeof virtualListing;
  tokenGraph: typeof virtualTokenGraph;
  defaultTuple: typeof virtualDefaultTuple;
}
if (import.meta.hot) {
  import.meta.hot.on(HMR_EVENT, (payload: HmrSnapshot) => {
    ensureStylesheet(payload.css, payload.cssVarPrefix);
    const channel = addons.getChannel();
    channel.emit(INIT_EVENT, toInitPayload(payload));
    channel.emit(TOKENS_UPDATED_EVENT, payload);
  });
}
