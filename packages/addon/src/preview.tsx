import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect, useMemo } from 'react';
import { addons } from 'storybook/preview-api';
import { dataAttr } from '#/data-attr.ts';
import {
  axes as virtualAxes,
  css,
  cssVarPrefix,
  defaultTheme,
  diagnostics,
  disabledAxes as virtualDisabledAxes,
  presets as virtualPresets,
  themes,
  themesResolved,
} from 'virtual:swatchbook/tokens';
import {
  AxesContext,
  COLOR_FORMATS,
  type ColorFormat,
  ColorFormatContext,
  type ProjectSnapshot,
  SwatchbookContext,
  ThemeContext,
} from '@unpunnyfuns/swatchbook-blocks';
import {
  AXES_GLOBAL_KEY,
  COLOR_FORMAT_GLOBAL_KEY,
  GLOBAL_KEY,
  INIT_EVENT,
  INIT_REQUEST_EVENT,
  PREVIEW_MOUSEDOWN_EVENT,
  PARAM_KEY,
  STYLE_ELEMENT_ID,
} from '#/constants.ts';

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
 * Apply `cb(axisName, value)` for every pinned (disabled) axis whose value
 * is present on any surviving theme's `input`. Disabled axes don't appear
 * in `virtualAxes`, but CSS may still reference their pinned value on
 * compound selectors — every theme that survived filtering carries the
 * same pinned context per disabled axis, so sampling any theme works.
 */
function forEachPinnedAxis(cb: (name: string, value: string) => void): void {
  const pinnedSample = themes[0]?.input;
  if (!pinnedSample) return;
  for (const name of virtualDisabledAxes) {
    const value = pinnedSample[name];
    if (value !== undefined) cb(name, value);
  }
}

/**
 * Pick the theme name for a tuple, falling back to `defaultTheme` and then
 * the first theme. Returns empty string when the project has no themes so
 * callers can omit the attr instead of writing a made-up context name.
 */
function matchThemeName(tuple: Readonly<Record<string, string>>): string {
  const match = themes.find((t) => {
    const input = t.input as Record<string, string>;
    return Object.keys(input).every((k) => input[k] === tuple[k]);
  });
  return match?.name ?? defaultTheme ?? themes[0]?.name ?? '';
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
    themes,
    defaultTheme,
    themesResolved,
    diagnostics,
    cssVarPrefix,
  });
}

/** Axis-default tuple, used as the baseline before overrides. */
function defaultTuple(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of virtualAxes) out[axis.name] = axis.default;
  return out;
}

/** Look up a `Theme.input` by composed name. Returns `undefined` if no theme matches. */
function tupleForName(name: string): Record<string, string> | undefined {
  const match = themes.find((t) => t.name === name);
  return match?.input;
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
 * Resolve the active tuple from all four input channels, in priority order:
 *   1. `parameters.swatchbook.axes` — per-story tuple.
 *   2. `parameters.swatchbook.theme` — per-story composed name (legacy).
 *   3. `globals.swatchbookAxes` — toolbar-set tuple.
 *   4. `globals.swatchbookTheme` — toolbar-set composed name.
 *   5. virtual module default.
 */
function resolveTuple(
  globals: Record<string, unknown>,
  parameters: Record<string, Record<string, unknown>>,
): Record<string, string> {
  const param = parameters[PARAM_KEY];
  const paramAxes = param?.['axes'];
  if (paramAxes && typeof paramAxes === 'object') {
    return normalizeTuple(paramAxes as Record<string, string>);
  }
  const paramTheme = param?.['theme'];
  if (typeof paramTheme === 'string') {
    const hit = tupleForName(paramTheme);
    if (hit) return normalizeTuple(hit);
  }
  const globalAxes = globals[AXES_GLOBAL_KEY];
  if (globalAxes && typeof globalAxes === 'object') {
    return normalizeTuple(globalAxes as Record<string, string>);
  }
  const globalTheme = globals[GLOBAL_KEY];
  if (typeof globalTheme === 'string') {
    const hit = tupleForName(globalTheme);
    if (hit) return normalizeTuple(hit);
  }
  return defaultTuple();
}

function resolveColorFormat(globals: Record<string, unknown>): ColorFormat {
  const raw = globals[COLOR_FORMAT_GLOBAL_KEY];
  if (typeof raw === 'string' && (COLOR_FORMATS as readonly string[]).includes(raw)) {
    return raw as ColorFormat;
  }
  return 'hex';
}

const themedDecorator: Decorator = (Story, context) => {
  const tuple = useMemo(
    () =>
      resolveTuple(
        context.globals as Record<string, unknown>,
        context.parameters as Record<string, Record<string, unknown>>,
      ),
    [context.globals, context.parameters],
  );
  const colorFormat = useMemo(
    () => resolveColorFormat(context.globals as Record<string, unknown>),
    [context.globals],
  );
  const themeName = useMemo(() => matchThemeName(tuple), [tuple]);

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
      themes,
      themesResolved,
      activeTheme: themeName,
      activeAxes: tuple,
      cssVarPrefix,
      diagnostics,
      css,
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
  [GLOBAL_KEY]: {
    name: 'Theme',
    description: 'Active swatchbook theme (composed permutation ID).',
  },
  [AXES_GLOBAL_KEY]: {
    name: 'Axes',
    description: 'Per-axis context selection. Takes precedence over the composed theme name.',
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
  [GLOBAL_KEY]: defaultTheme ?? themes[0]?.name ?? '',
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
  const apply = (globals: Record<string, unknown>): void => {
    ensureStylesheet();
    const tuple = resolveTuple(globals, {});
    setRootAxes(matchThemeName(tuple), tuple);
  };
  const onGlobals = (payload: { globals?: Record<string, unknown> }): void => {
    if (payload.globals) apply(payload.globals);
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
