import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect, useMemo } from 'react';
import { addons } from 'storybook/preview-api';
import {
  axes as virtualAxes,
  css,
  cssVarPrefix,
  defaultTheme,
  diagnostics,
  presets as virtualPresets,
  themes,
  themesResolved,
} from 'virtual:swatchbook/tokens';
import {
  AXES_GLOBAL_KEY,
  DATA_THEME_ATTR,
  GLOBAL_KEY,
  INIT_EVENT,
  PARAM_KEY,
  STYLE_ELEMENT_ID,
} from '#/constants.ts';
import { type ProjectSnapshot, SwatchbookContext } from '#/swatchbook-context.ts';
import { AxesContext, ThemeContext } from '#/theme-context.ts';

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
  background: var(${v('color-sys-surface-default')}, Canvas);
  color: var(${v('color-sys-text-default')}, CanvasText);
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
 * Write the composed permutation ID to `data-theme` plus one
 * `data-<axis>=<context>` per axis. The composed ID stays for CSS
 * emission's current `[data-theme="…"]` selectors (retires in #135);
 * per-axis attributes are what upcoming toolbar + panel work will key on.
 */
function setRootAxes(themeName: string, tuple: Readonly<Record<string, string>>): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute(DATA_THEME_ATTR, themeName);
  for (const axis of virtualAxes) {
    const value = tuple[axis.name];
    if (value === undefined) {
      root.removeAttribute(`data-${axis.name}`);
    } else {
      root.setAttribute(`data-${axis.name}`, value);
    }
  }
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

const themedDecorator: Decorator = (Story, context) => {
  const tuple = useMemo(
    () =>
      resolveTuple(
        context.globals as Record<string, unknown>,
        context.parameters as Record<string, Record<string, unknown>>,
      ),
    [context.globals, context.parameters],
  );
  const themeName = useMemo(() => {
    const match = themes.find((t) => {
      const input = t.input as Record<string, string>;
      return Object.keys(input).every((k) => input[k] === tuple[k]);
    });
    return match?.name ?? defaultTheme ?? themes[0]?.name ?? 'Light';
  }, [tuple]);

  useEffect(() => {
    ensureStylesheet();
    broadcastInit();
  }, []);

  useEffect(() => {
    setRootAxes(themeName, tuple);
  }, [themeName, tuple]);

  const wrapperAttrs: Record<string, string> = { [DATA_THEME_ATTR]: themeName };
  for (const axis of virtualAxes) {
    const value = tuple[axis.name];
    if (value !== undefined) wrapperAttrs[`data-${axis.name}`] = value;
  }

  const snapshot = useMemo<ProjectSnapshot>(
    () => ({
      axes: virtualAxes,
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
          <div
            {...wrapperAttrs}
            style={{
              padding: '1rem',
              minHeight: '100%',
            }}
          >
            <Story />
          </div>
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
};

function buildInitialAxes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of virtualAxes) out[axis.name] = axis.default;
  return out;
}

export const initialGlobals: NonNullable<Preview['initialGlobals']> = {
  [GLOBAL_KEY]: defaultTheme ?? themes[0]?.name ?? 'Light',
  [AXES_GLOBAL_KEY]: buildInitialAxes(),
};
