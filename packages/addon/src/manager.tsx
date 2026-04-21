import { ThemeSwitcher } from '@unpunnyfuns/swatchbook-switcher';
import { type ColorFormat, ColorFormatSelector } from '#/ColorFormatSelector.tsx';
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { IconButton, WithTooltipPure } from 'storybook/internal/components';
import { addons, types, useGlobals, useStorybookApi } from 'storybook/manager-api';
import {
  type InitPayload,
  type VirtualAxis as AxisEntry,
  type VirtualPreset as PresetEntry,
  type VirtualTheme as ThemeEntry,
} from '#/channel-types.ts';
import {
  ADDON_ID,
  AXES_GLOBAL_KEY,
  COLOR_FORMAT_GLOBAL_KEY,
  GLOBAL_KEY,
  INIT_EVENT,
  INIT_REQUEST_EVENT,
  PREVIEW_MOUSEDOWN_EVENT,
  TOOL_ID,
} from '#/constants.ts';

/**
 * Use explicit `React.createElement` rather than JSX so the manager bundle
 * doesn't take a hard dependency on `react/jsx-runtime`. Storybook's manager
 * page injects its own React as a runtime global; `react/jsx-runtime` isn't
 * always part of that exposure, which breaks JSX with
 * "Cannot read properties of undefined (reading 'recentlyCreatedOwnerStacks')".
 * Mirrors the pattern `@storybook/addon-a11y` uses in its manager.
 *
 * The imported `<ThemeSwitcher>` from `@unpunnyfuns/swatchbook-switcher`
 * compiles with classic JSX (`React.createElement`) specifically so it
 * survives embedding in the manager bundle the same way.
 */
const h = React.createElement;

const EMPTY_AXES: readonly AxisEntry[] = [];
const EMPTY_PRESETS: readonly PresetEntry[] = [];
const EMPTY_THEMES: readonly ThemeEntry[] = [];

/**
 * Root toolbar glyph — a split-circle ("yinyang") mark: a faint filled
 * disc for the full-swatch silhouette, with a darker half-and-inset-disc
 * path reading as a pair of theme variants swapped in place.
 */
function SwatchbookIcon(): ReactElement {
  return h(
    'svg',
    { width: 14, height: 14, viewBox: '0 0 14 14', 'aria-hidden': true },
    h('circle', { cx: 7, cy: 7, r: 6, fill: 'currentColor', opacity: 0.15 }),
    h('path', {
      d: 'M7 1a6 6 0 0 0 0 12 3 3 0 0 0 0-6 3 3 0 0 1 0-6Z',
      fill: 'currentColor',
    }),
  );
}

function tupleMatchesInput(
  tuple: Readonly<Record<string, string>>,
  input: Readonly<Record<string, string>>,
): boolean {
  const keys = Object.keys(input);
  if (keys.length === 0) return false;
  return keys.every((k) => input[k] === tuple[k]);
}

function composedNameFor(
  tuple: Readonly<Record<string, string>>,
  themes: readonly ThemeEntry[],
  fallback: string,
): string {
  const match = themes.find((t) => tupleMatchesInput(tuple, t.input));
  return match?.name ?? fallback;
}

function defaultTupleFor(axes: readonly AxisEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) out[axis.name] = axis.default;
  return out;
}

/**
 * Compose a preset's sanitized partial tuple with the axis defaults, so
 * applying a preset that only names some axes leaves the omitted ones at
 * their defaults (not blank). Mirrors the preview decorator's own fallback
 * logic so what the toolbar sends out is what the decorator honors.
 */
function presetTuple(
  preset: PresetEntry,
  axes: readonly AxisEntry[],
  defaults: Readonly<Record<string, string>>,
): Record<string, string> {
  const out: Record<string, string> = { ...defaults };
  for (const axis of axes) {
    const candidate = preset.axes[axis.name];
    if (candidate !== undefined && axis.contexts.includes(candidate)) {
      out[axis.name] = candidate;
    }
  }
  return out;
}

function AxesToolbar(): ReactElement {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();
  const [payload, setPayload] = useState<InitPayload | null>(null);
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const channel = addons.getChannel();
    const onInit = (next: InitPayload): void => setPayload(next);
    channel.on(INIT_EVENT, onInit);
    /**
     * Ask the preview to (re-)emit INIT_EVENT in case it already broadcast
     * before this effect subscribed. Without this request, a late-mounting
     * manager (story navigation, docs reload) can stay in "loading…" until
     * the user triggers a globals change.
     */
    channel.emit(INIT_REQUEST_EVENT);
    return () => {
      channel.off(INIT_EVENT, onInit);
    };
  }, []);

  const axes = payload?.axes ?? EMPTY_AXES;
  const presets = payload?.presets ?? EMPTY_PRESETS;
  const themes = payload?.themes ?? EMPTY_THEMES;
  const defaults = useMemo(() => defaultTupleFor(axes), [axes]);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const globalTuple = globals[AXES_GLOBAL_KEY] as Record<string, string> | undefined;
  const activeColorFormat = ((globals[COLOR_FORMAT_GLOBAL_KEY] as string | undefined) ??
    'hex') as ColorFormat;

  const activeTuple = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = { ...defaults };
    if (globalTuple) {
      for (const axis of axes) {
        const candidate = globalTuple[axis.name];
        if (candidate !== undefined && axis.contexts.includes(candidate)) {
          out[axis.name] = candidate;
        }
      }
    }
    return out;
  }, [axes, defaults, globalTuple]);

  const setAxis = useCallback(
    (axisName: string, next: string): void => {
      const tuple: Record<string, string> = { ...activeTuple, [axisName]: next };
      const fallback = payload?.defaultTheme ?? themes[0]?.name ?? '';
      const composed = composedNameFor(tuple, themes, fallback);
      updateGlobals({ [AXES_GLOBAL_KEY]: tuple, [GLOBAL_KEY]: composed });
    },
    [activeTuple, themes, payload?.defaultTheme, updateGlobals],
  );

  const applyPreset = useCallback(
    (preset: PresetEntry): void => {
      const tuple = presetTuple(preset, axes, defaults);
      const fallback = payload?.defaultTheme ?? themes[0]?.name ?? '';
      const composed = composedNameFor(tuple, themes, fallback);
      updateGlobals({ [AXES_GLOBAL_KEY]: tuple, [GLOBAL_KEY]: composed });
      setLastApplied(preset.name);
    },
    [axes, defaults, themes, payload?.defaultTheme, updateGlobals],
  );

  useEffect(() => {
    if (presets.length === 0) return;
    /**
     * `alt+shift+C` cycles through the project's presets, applying the
     * next one each press. When no preset has been applied yet, starts
     * from the first. Stays out of Storybook's core shortcut surface —
     * the earlier default (`alt+T`) collided with the built-in "toggle
     * addon panel" binding on some platforms. Users can still rebind it
     * through Storybook's own keyboard-shortcuts panel.
     *
     * Only registers when the project actually defines presets. For
     * projects without presets the cycle would have nothing to cycle
     * through, so the shortcut disappears entirely rather than sitting
     * dead in the menu.
     */
    api.setAddonShortcut(ADDON_ID, {
      label: `Cycle swatchbook presets (${presets.length})`,
      defaultShortcut: ['alt', 'shift', 'C'],
      actionName: 'cyclePreset',
      showInMenu: true,
      action: () => {
        const currentIdx = lastApplied
          ? presets.findIndex((preset) => preset.name === lastApplied)
          : -1;
        const next = presets[(currentIdx + 1) % presets.length];
        if (next) applyPreset(next);
      },
    });
  }, [api, presets, lastApplied, applyPreset]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    }
  }, []);

  /**
   * Escape closes even when focus hasn't entered the popover yet (e.g. the
   * user opened it via click and the mouse is still over the canvas). We
   * attach a document-level listener when open.
   */
  useEffect(() => {
    if (!open) return;
    const onDocKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onDocKey);
    return () => document.removeEventListener('keydown', onDocKey);
  }, [open]);

  /**
   * `WithTooltipPure`'s built-in `closeOnOutsideClick` misses some cases
   * (portaled popover + manager iframe boundaries). Belt-and-suspenders:
   * close when the user mouses down anywhere that isn't the trigger wrapper
   * or the popover body.
   */
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent): void => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (bodyRef.current?.contains(target)) return;
      if (target.closest('[data-testid="swatchbook-switcher"]')) return;
      setOpen(false);
    };
    /**
     * The manager's document-level listener above can't see mousedowns
     * inside the preview iframe. Preview emits PREVIEW_MOUSEDOWN_EVENT on
     * every mousedown over its own document; listen for it here so
     * clicking the canvas / docs page also closes the popover.
     */
    const channel = addons.getChannel();
    const onPreviewMouseDown = (): void => setOpen(false);
    document.addEventListener('mousedown', onDocMouseDown);
    channel.on(PREVIEW_MOUSEDOWN_EVENT, onPreviewMouseDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      channel.off(PREVIEW_MOUSEDOWN_EVENT, onPreviewMouseDown);
    };
  }, [open]);

  if (axes.length === 0) {
    return h(
      IconButton,
      { key: TOOL_ID, title: 'Swatchbook theme (loading…)', disabled: true },
      h(SwatchbookIcon),
    );
  }

  const summary = axes.map((a) => activeTuple[a.name] ?? a.default).join(' · ');
  const title = `Swatchbook · ${summary}`;

  const button = h(
    IconButton,
    {
      key: TOOL_ID,
      title,
      active: open,
      onClick: () => setOpen((prev) => !prev),
    },
    h(SwatchbookIcon),
  );

  const tooltipBody = h(ThemeSwitcher, {
    axes,
    presets,
    themes,
    activeTuple,
    defaults,
    lastApplied,
    onAxisChange: setAxis,
    onPresetApply: applyPreset,
    onKeyDown: handleKeyDown,
    /**
     * Color format is addon-local chrome — drives how swatchbook blocks
     * stringify colors inside stories and docs. Slotted through the
     * switcher's `footer` escape hatch so shared theming UI stays free
     * of this concern.
     */
    footer: h(ColorFormatSelector, {
      active: activeColorFormat,
      onSelect: (next: ColorFormat) => updateGlobals({ [COLOR_FORMAT_GLOBAL_KEY]: next }),
    }),
  });

  return h(
    'span',
    { ref: bodyRef, style: { display: 'inline-flex', alignItems: 'center' } },
    h(WithTooltipPure, {
      placement: 'bottom',
      trigger: 'click',
      visible: open,
      onVisibleChange: (next: boolean) => setOpen(next),
      closeOnOutsideClick: true,
      tooltip: tooltipBody,
      children: button,
    }),
  );
}

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Swatchbook theme',
    match: ({ viewMode, tabId }) => !tabId && (viewMode === 'story' || viewMode === 'docs'),
    render: () => h(AxesToolbar),
  });
});
