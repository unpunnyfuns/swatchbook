/// <reference types="vite/client" />
import { buildResolveAt } from '@unpunnyfuns/swatchbook-core/resolve-at';
import type {
  Axis as CoreAxis,
  Cells as CoreCells,
  JointOverrides,
} from '@unpunnyfuns/swatchbook-core';
import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect, useMemo } from 'react';
import { addons } from 'storybook/preview-api';
import { dataAttr } from '@unpunnyfuns/swatchbook-core/data-attr';
import { tupleToName } from '@unpunnyfuns/swatchbook-core/themes';
// Side-effect import for integrations that opted into `autoInject`
// (e.g. Tailwind's `@theme` block). When no integration opts in, the
// virtual module body is empty — still a valid no-op.
import 'virtual:swatchbook/integration-side-effects';
import {
  axes as virtualAxes,
  cells as virtualCells,
  css,
  cssVarPrefix,
  defaultTuple as virtualDefaultTuple,
  diagnostics,
  disabledAxes as virtualDisabledAxes,
  jointOverrides as virtualJointOverrides,
  listing as virtualListing,
  presets as virtualPresets,
  varianceByPath as virtualVarianceByPath,
} from 'virtual:swatchbook/tokens';
import {
  AxesContext,
  COLOR_FORMATS,
  type ColorFormat,
  ColorFormatContext,
  type ProjectSnapshot,
  SwatchbookContext,
  PermutationContext,
} from '@unpunnyfuns/swatchbook-blocks';
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
import type { StoryParameters, SwatchbookGlobals } from '#/globals.ts';

/** CSS var name with the active prefix applied. */
function v(name: string): string {
  return cssVarPrefix ? `--${cssVarPrefix}-${name}` : `--${name}`;
}

/**
 * Inject the per-theme stylesheet plus a tiny `html, body { ... }` block so
 * the iframe's own chrome (outside any decorator wrapper — Docs mode,
 * autodocs, empty gutters) also picks up the active theme.
 */
function ensureStylesheet(): void {
  if (typeof document === 'undefined') return;
  const bodyRules = `
html, body {
  background: var(${v('color-surface-default')}, Canvas);
  color: var(${v('color-text-default')}, CanvasText);
  margin: 0;
}
`;
  const text = `${css}\n${bodyRules}`;
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== text) style.textContent = text;
}

/**
 * Apply `cb(axisName, value)` for every pinned (disabled) axis whose
 * default-tuple value is set. `virtualDefaultTuple` carries the
 * post-filter axis defaults; disabled axes don't appear in
 * `virtualAxes` but their pinned context value still lives here, so
 * sampling it gives the same result the old "first permutation's
 * input" lookup did.
 */
function forEachPinnedAxis(cb: (name: string, value: string) => void): void {
  for (const name of virtualDisabledAxes) {
    const value = virtualDefaultTuple[name];
    if (value !== undefined) cb(name, value);
  }
}

/**
 * Compose a stable theme name from a tuple — `axisValues.join(' · ')`
 * in axis order. Used for the `data-<prefix>-theme` attribute and the
 * `swatchbook/theme` channel signal. Returns empty string when there
 * are no axes (no name to write).
 */
function matchPermutationName(tuple: Readonly<Record<string, string>>): string {
  if (virtualAxes.length === 0) return '';
  return tupleToName(virtualAxes, tuple);
}

/**
 * Write the composed permutation ID to `data-<prefix>-theme` plus one
 * `data-<prefix>-<axis>=<context>` per axis. Prefix follows `cssVarPrefix`
 * so the attr namespace and the emitted-CSS selectors stay in lockstep;
 * empty prefix keeps the bare `data-theme` form.
 */
function setRootAxes(themeName: string, tuple: Readonly<Record<string, string>>): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const themeAttr = dataAttr(cssVarPrefix, 'theme');
  if (themeName) root.setAttribute(themeAttr, themeName);
  else root.removeAttribute(themeAttr);
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

/**
 * Emit the full virtual-module payload to the manager over Storybook's
 * channel so the toolbar + panel (which run in the manager bundle and
 * can't import our virtual module) can render from it.
 */
function broadcastInit(): void {
  const channel = addons.getChannel();
  channel.emit(INIT_EVENT, {
    axes: virtualAxes,
    disabledAxes: virtualDisabledAxes,
    presets: virtualPresets,
    diagnostics,
    cssVarPrefix,
    cells: virtualCells,
    jointOverrides: virtualJointOverrides,
    varianceByPath: virtualVarianceByPath,
    defaultTuple: virtualDefaultTuple,
  });
}

/** Axis-default tuple, used as the baseline before overrides. */
function defaultTuple(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of virtualAxes) out[axis.name] = axis.default;
  return out;
}

/**
 * Reverse-engineer a tuple from a `Light · Brand A · Normal`-shape
 * theme name. Splits on ` · ` and zips with `virtualAxes` in declared
 * order — matches `matchPermutationName`'s production direction so a
 * round-trip is lossless. Returns `undefined` when the segment count
 * doesn't match the axis count.
 */
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

/**
 * Merge a partial tuple onto the axis defaults, dropping keys for axes that
 * don't exist and silently falling back to the default for contexts that
 * aren't listed on the axis.
 */
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

/**
 * Resolve the active tuple from all input channels, in priority order:
 *   1. `parameters.swatchbook.axes` — per-story tuple.
 *   2. `parameters.swatchbook.permutation` — per-story composed name.
 *   3. `globals.swatchbookAxes` — toolbar-set tuple.
 *   4. virtual module default.
 */
function resolveTuple(
  globals: SwatchbookGlobals,
  parameters: StoryParameters,
): Record<string, string> {
  const param = parameters.swatchbook;
  const paramAxes = param?.axes;
  if (paramAxes) {
    return normalizeTuple(paramAxes);
  }
  if (param?.permutation) {
    const hit = tupleForName(param.permutation);
    if (hit) return normalizeTuple(hit);
  }
  const globalAxes = globals[AXES_GLOBAL_KEY];
  if (globalAxes && typeof globalAxes === 'object') {
    return normalizeTuple(globalAxes as Record<string, string>);
  }
  return defaultTuple();
}

function resolveColorFormat(globals: SwatchbookGlobals): ColorFormat {
  const raw = globals[COLOR_FORMAT_GLOBAL_KEY];
  if (typeof raw === 'string' && (COLOR_FORMATS as readonly string[]).includes(raw)) {
    return raw as ColorFormat;
  }
  return 'hex';
}

/**
 * Single shared `resolveAt` instance for the lifetime of the preview
 * iframe. The inputs (`virtualAxes`, `virtualCells`, …) are all
 * module-level virtual-module exports with stable identity, so this
 * never needs to rebuild; downstream `ProjectSnapshot` consumers can
 * key memos on the snapshot wrapper without worrying about
 * `resolveAt` churning when Storybook recreates `context.globals`.
 */
const previewResolveAt = buildResolveAt(
  virtualAxes as readonly CoreAxis[],
  virtualCells as CoreCells,
  virtualJointOverrides as JointOverrides,
  virtualDefaultTuple,
);

const themedDecorator: Decorator = (Story, context) => {
  const globals = context.globals as SwatchbookGlobals;
  const parameters = context.parameters as StoryParameters;
  const tuple = useMemo(() => resolveTuple(globals, parameters), [globals, parameters]);
  const colorFormat = useMemo(() => resolveColorFormat(globals), [globals]);
  const themeName = useMemo(() => matchPermutationName(tuple), [tuple]);

  useEffect(() => {
    ensureStylesheet();
    broadcastInit();
  }, []);

  useEffect(() => {
    setRootAxes(themeName, tuple);
  }, [themeName, tuple]);

  const wrapperAttrs: Record<string, string> = {};
  if (themeName) wrapperAttrs[dataAttr(cssVarPrefix, 'theme')] = themeName;
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
      activePermutation: themeName,
      activeAxes: tuple,
      cssVarPrefix,
      diagnostics,
      css,
      listing: virtualListing,
      cells: virtualCells,
      jointOverrides: virtualJointOverrides,
      varianceByPath: virtualVarianceByPath,
      defaultTuple: virtualDefaultTuple,
      resolveAt: previewResolveAt,
    }),
    [themeName, tuple],
  );

  return (
    <SwatchbookContext.Provider value={snapshot}>
      <PermutationContext.Provider value={themeName}>
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
          </ColorFormatContext.Provider>
        </AxesContext.Provider>
      </PermutationContext.Provider>
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
    description: 'Per-axis context selection — the active permutation tuple.',
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

/**
 * Module-level channel subscription: writes the active tuple's attributes
 * onto `<html>` regardless of whether a story decorator is rendering.
 *
 * The {@link themedDecorator} already sets these inside story renders, but
 * it never runs on MDX docs pages that embed blocks without `<Story />`.
 * Without attrs on an ancestor, the per-tuple CSS selectors
 * (`[data-mode="Dark"][data-brand="…"]`) don't match and everything falls
 * back to the `:root` default tuple — so colors stay defaults even after
 * the toolbar switches axes. Subscribing globally fixes MDX docs at the
 * cost of one idempotent redundant write per story render.
 */
function installGlobalAxisApplier(): void {
  if (typeof document === 'undefined') return;
  const channel = addons.getChannel();
  /**
   * Inject the stylesheet and emit the init payload once on module load so
   * the manager's toolbar populates and CSS vars are available even when no
   * story/decorator ever runs (bare MDX docs pages). Without these, the
   * toolbar sits in its disabled "loading…" state and nothing is styled.
   */
  ensureStylesheet();
  broadcastInit();
  /**
   * If the manager subscribes to INIT_EVENT after our initial broadcast,
   * it misses the payload and the toolbar stays in its "loading…" state
   * until something else re-fires it. Honor an explicit request event so
   * a late-mounting manager can ask for the payload.
   */
  channel.on(INIT_REQUEST_EVENT, broadcastInit);
  const apply = (globals: SwatchbookGlobals): void => {
    ensureStylesheet();
    const tuple = resolveTuple(globals, {});
    setRootAxes(matchPermutationName(tuple), tuple);
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
    const tuple = resolveTuple(payload.globals, {});
    const fingerprint = matchPermutationName(tuple);
    if (fingerprint === lastApplied) return;
    lastApplied = fingerprint;
    apply(payload.globals);
  };
  channel.on('globalsUpdated', onGlobals);
  channel.on('setGlobals', onGlobals);
  channel.on('updateGlobals', onGlobals);
}

installGlobalAxisApplier();

/**
 * Bridge `mousedown` inside the preview iframe to the manager via a
 * dedicated channel event. The toolbar popover's outside-click listener
 * runs on the manager's document, which can't observe mousedowns inside
 * the preview; without this bridge, clicking the canvas leaves the
 * popover open. Idempotent: fires at most once per real mousedown.
 */
function installPreviewMouseDownBridge(): void {
  if (typeof document === 'undefined') return;
  const channel = addons.getChannel();
  document.addEventListener('mousedown', () => {
    channel.emit(PREVIEW_MOUSEDOWN_EVENT);
  });
}

installPreviewMouseDownBridge();

/**
 * Wire the dev-time token-refresh HMR path. The plugin emits `HMR_EVENT`
 * with the fresh virtual-module payload whenever a watched source file
 * changes; we re-inject the stylesheet and forward to the Storybook
 * channel so the toolbar re-renders and blocks can re-subscribe with
 * the new snapshot — no full preview reload, so args / scroll / open
 * overlays survive the refresh. No-ops in production where
 * `import.meta.hot` is undefined.
 */
interface HmrSnapshot {
  axes: typeof virtualAxes;
  disabledAxes: typeof virtualDisabledAxes;
  presets: typeof virtualPresets;
  diagnostics: typeof diagnostics;
  css: string;
  cssVarPrefix: string;
  listing: typeof virtualListing;
  cells: typeof virtualCells;
  jointOverrides: typeof virtualJointOverrides;
  varianceByPath: typeof virtualVarianceByPath;
  defaultTuple: typeof virtualDefaultTuple;
}
if (import.meta.hot) {
  import.meta.hot.on(HMR_EVENT, (payload: HmrSnapshot) => {
    if (typeof document !== 'undefined') {
      const bodyRules = `
html, body {
  background: var(${payload.cssVarPrefix ? `--${payload.cssVarPrefix}-` : '--'}color-surface-default, Canvas);
  color: var(${payload.cssVarPrefix ? `--${payload.cssVarPrefix}-` : '--'}color-text-default, CanvasText);
  margin: 0;
}
`;
      const text = `${payload.css}\n${bodyRules}`;
      let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ELEMENT_ID;
        document.head.appendChild(style);
      }
      if (style.textContent !== text) style.textContent = text;
    }
    const channel = addons.getChannel();
    channel.emit(INIT_EVENT, {
      axes: payload.axes,
      disabledAxes: payload.disabledAxes,
      presets: payload.presets,
      diagnostics: payload.diagnostics,
      cssVarPrefix: payload.cssVarPrefix,
      cells: payload.cells,
      jointOverrides: payload.jointOverrides,
      varianceByPath: payload.varianceByPath,
      defaultTuple: payload.defaultTuple,
    });
    channel.emit(TOKENS_UPDATED_EVENT, payload);
  });
}
