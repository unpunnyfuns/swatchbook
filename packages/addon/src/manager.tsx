import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { IconButton, WithTooltipPure } from 'storybook/internal/components';
import { addons, types, useGlobals, useStorybookApi } from 'storybook/manager-api';
import {
  ADDON_ID,
  AXES_GLOBAL_KEY,
  COLOR_FORMAT_GLOBAL_KEY,
  GLOBAL_KEY,
  INIT_EVENT,
  PANEL_ID,
  TOOL_ID,
} from '#/constants.ts';
import { DesignTokensPanel } from '#/panel.tsx';

/**
 * Use explicit `React.createElement` rather than JSX so the manager bundle
 * doesn't take a hard dependency on `react/jsx-runtime`. Storybook's manager
 * page injects its own React as a runtime global; `react/jsx-runtime` isn't
 * always part of that exposure, which breaks JSX with
 * "Cannot read properties of undefined (reading 'recentlyCreatedOwnerStacks')".
 * Mirrors the pattern `@storybook/addon-a11y` uses in its manager.
 */
const h = React.createElement;

interface AxisEntry {
  name: string;
  contexts: readonly string[];
  default: string;
  description?: string;
  source: 'resolver' | 'synthetic';
}

interface ThemeEntry {
  name: string;
  input: Record<string, string>;
  sources: string[];
}

interface PresetEntry {
  name: string;
  axes: Partial<Record<string, string>>;
  description?: string;
}

interface InitPayload {
  axes: readonly AxisEntry[];
  presets: readonly PresetEntry[];
  themes: ThemeEntry[];
  defaultTheme: string | null;
}

const EMPTY_AXES: readonly AxisEntry[] = [];
const EMPTY_PRESETS: readonly PresetEntry[] = [];
const EMPTY_THEMES: ThemeEntry[] = [];

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
 * Treat the `{ name: 'theme', source: 'synthetic' }` axis — the one core
 * fabricates for single-theme projects with no resolver — as a special case
 * that uses the label "Theme" instead of the axis name. Authored single-axis
 * resolvers keep their real axis name (e.g. `mode`).
 */
function displayLabelFor(axis: AxisEntry): string {
  if (axis.source === 'synthetic' && axis.name === 'theme') return 'Theme';
  return axis.name;
}

/**
 * Compose a preset's sanitized partial tuple with the axis defaults, so
 * applying a preset that only names some axes leaves the omitted ones at
 * their defaults (not blank). Matches the preview decorator's own fallback
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

function tuplesEqual(
  a: Readonly<Record<string, string>>,
  b: Readonly<Record<string, string>>,
  axes: readonly AxisEntry[],
): boolean {
  for (const axis of axes) {
    if (a[axis.name] !== b[axis.name]) return false;
  }
  return true;
}

const SECTION_LABEL_STYLE: React.CSSProperties = {
  padding: '8px 12px 4px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  opacity: 0.6,
};

const SECTION_BODY_STYLE: React.CSSProperties = {
  padding: '0 12px 10px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
};

const AXIS_ROW_STYLE: React.CSSProperties = {
  padding: '0 12px 10px',
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  columnGap: 12,
  rowGap: 4,
  alignItems: 'center',
};

const AXIS_LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  opacity: 0.85,
};

const AXIS_PILLS_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
};

const OPTION_PILL_BASE: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: 4,
  fontSize: 12,
  lineHeight: '18px',
  // Longhand border properties (not the `border` shorthand) so
  // active → inactive only updates `borderColor`'s value instead of
  // *removing* the key from inline style. Removing it lets Storybook's
  // theme paint a stray border-color on the previously-selected pill.
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'transparent',
  background: 'transparent',
  cursor: 'pointer',
  color: 'inherit',
  outline: 'none',
  boxShadow: 'none',
};

const OPTION_PILL_ACTIVE: React.CSSProperties = {
  ...OPTION_PILL_BASE,
  fontWeight: 600,
  background: 'rgba(0, 122, 255, 0.12)',
  borderColor: 'rgba(0, 122, 255, 0.45)',
};

const PRESET_PILL_MODIFIED: React.CSSProperties = {
  display: 'inline-block',
  width: 6,
  height: 6,
  marginLeft: 6,
  borderRadius: '50%',
  background: 'currentColor',
  opacity: 0.6,
  verticalAlign: 'middle',
};

const DIVIDER_STYLE: React.CSSProperties = {
  height: 1,
  background: 'currentColor',
  opacity: 0.1,
  margin: '2px 8px',
};

interface OptionPillProps {
  label: string;
  active: boolean;
  title?: string;
  onClick: () => void;
  trailing?: ReactElement | null;
}

function OptionPill({ label, active, title, onClick, trailing }: OptionPillProps): ReactElement {
  return h(
    'button',
    {
      type: 'button',
      title,
      onClick,
      // Skip focus on mouse click so Storybook's `:focus` border-color
      // theming doesn't stick on the previously-clicked pill. Keyboard
      // tabbing still lands focus normally — preventDefault on mousedown
      // only blocks the implicit focus-on-click behavior.
      onMouseDown: (event) => event.preventDefault(),
      style: active ? OPTION_PILL_ACTIVE : OPTION_PILL_BASE,
    },
    label,
    trailing ?? null,
  );
}

interface PresetsSectionProps {
  presets: readonly PresetEntry[];
  axes: readonly AxisEntry[];
  defaults: Readonly<Record<string, string>>;
  activeTuple: Readonly<Record<string, string>>;
  lastApplied: string | null;
  onApply: (preset: PresetEntry) => void;
}

function PresetsSection({
  presets,
  axes,
  defaults,
  activeTuple,
  lastApplied,
  onApply,
}: PresetsSectionProps): ReactElement {
  return h(
    'div',
    null,
    h('div', { style: SECTION_LABEL_STYLE }, 'Presets'),
    h(
      'div',
      { style: SECTION_BODY_STYLE },
      ...presets.map((preset) => {
        const tuple = presetTuple(preset, axes, defaults);
        const matches = tuplesEqual(tuple, activeTuple, axes);
        const modified = !matches && preset.name === lastApplied;
        const title = preset.description ? `${preset.name} — ${preset.description}` : preset.name;
        return h(OptionPill, {
          key: `${TOOL_ID}/preset/${preset.name}`,
          label: preset.name,
          active: matches,
          title,
          onClick: () => onApply(preset),
          trailing: modified
            ? h('span', { 'aria-hidden': true, style: PRESET_PILL_MODIFIED })
            : null,
        });
      }),
    ),
  );
}

interface AxisSectionProps {
  axis: AxisEntry;
  active: string;
  onSelect: (next: string) => void;
}

function AxisSection({ axis, active, onSelect }: AxisSectionProps): ReactElement {
  const label = displayLabelFor(axis);
  return h(
    'div',
    { style: AXIS_ROW_STYLE },
    h('div', { style: AXIS_LABEL_STYLE, title: axis.description }, label),
    h(
      'div',
      { style: AXIS_PILLS_STYLE },
      ...axis.contexts.map((ctx) =>
        h(OptionPill, {
          key: `${TOOL_ID}/${axis.name}/${ctx}`,
          label: ctx,
          active: ctx === active,
          onClick: () => onSelect(ctx),
        }),
      ),
    ),
  );
}

const COLOR_FORMAT_OPTIONS: readonly { id: string; label: string }[] = [
  { id: 'hex', label: 'Hex' },
  { id: 'rgb', label: 'RGB' },
  { id: 'hsl', label: 'HSL' },
  { id: 'oklch', label: 'OKLCH' },
  { id: 'raw', label: 'Raw (JSON)' },
];

interface ColorFormatSectionProps {
  active: string;
  onSelect: (next: string) => void;
}

function ColorFormatSection({ active, onSelect }: ColorFormatSectionProps): ReactElement {
  return h(
    'div',
    null,
    h('div', { style: SECTION_LABEL_STYLE }, 'Color format'),
    h(
      'div',
      { style: SECTION_BODY_STYLE },
      ...COLOR_FORMAT_OPTIONS.map((opt) =>
        h(OptionPill, {
          key: `${TOOL_ID}/color-format/${opt.id}`,
          label: opt.label,
          active: opt.id === active,
          onClick: () => onSelect(opt.id),
        }),
      ),
    ),
  );
}

interface PopoverBodyProps {
  axes: readonly AxisEntry[];
  presets: readonly PresetEntry[];
  defaults: Readonly<Record<string, string>>;
  activeTuple: Readonly<Record<string, string>>;
  activeColorFormat: string;
  lastApplied: string | null;
  onApplyPreset: (preset: PresetEntry) => void;
  onSelectAxis: (axisName: string, next: string) => void;
  onSelectColorFormat: (next: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

function PopoverBody(props: PopoverBodyProps): ReactElement {
  const {
    axes,
    presets,
    defaults,
    activeTuple,
    activeColorFormat,
    lastApplied,
    onApplyPreset,
    onSelectAxis,
    onSelectColorFormat,
    onKeyDown,
  } = props;
  const sections: ReactElement[] = [];
  if (presets.length > 0) {
    sections.push(
      h(PresetsSection, {
        key: 'presets',
        presets,
        axes,
        defaults,
        activeTuple,
        lastApplied,
        onApply: onApplyPreset,
      }),
      h('div', { key: 'presets-divider', style: DIVIDER_STYLE }),
    );
  }
  axes.forEach((axis, idx) => {
    sections.push(
      h(AxisSection, {
        key: `axis-${axis.name}`,
        axis,
        active: activeTuple[axis.name] ?? axis.default,
        onSelect: (next) => onSelectAxis(axis.name, next),
      }),
    );
    if (idx === axes.length - 1) {
      sections.push(h('div', { key: 'axes-divider', style: DIVIDER_STYLE }));
    }
  });
  sections.push(
    h(ColorFormatSection, {
      key: 'color-format',
      active: activeColorFormat,
      onSelect: onSelectColorFormat,
    }),
  );
  return h(
    'div',
    {
      role: 'menu',
      tabIndex: -1,
      onKeyDown,
      style: { minWidth: 260, padding: '4px 0', outline: 'none' },
      'data-testid': 'swatchbook-toolbar-popover',
    },
    ...sections,
  );
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
  const activeColorFormat = (globals[COLOR_FORMAT_GLOBAL_KEY] as string | undefined) ?? 'hex';

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
    if (axes.length === 0) return;
    /**
     * alt+T cycles the primary (first) axis's contexts, keeping the rest
     * of the tuple pinned. With multi-axis projects this makes the shortcut
     * predictable — you always know which wheel you're spinning. For
     * single-axis projects the behavior is identical to the pre-N-dropdown
     * toolbar (cycle through every theme).
     */
    const primary = axes[0];
    if (!primary) return;
    api.setAddonShortcut(ADDON_ID, {
      label: `Cycle swatchbook ${displayLabelFor(primary)}`,
      defaultShortcut: ['alt', 'T'],
      actionName: 'cycleAxis',
      showInMenu: true,
      action: () => {
        const current = activeTuple[primary.name] ?? primary.default;
        const idx = primary.contexts.indexOf(current);
        const next = primary.contexts[(idx + 1) % primary.contexts.length];
        if (next !== undefined) setAxis(primary.name, next);
      },
    });
  }, [api, axes, activeTuple, setAxis]);

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

  const tooltipBody = h(PopoverBody, {
    axes,
    presets,
    defaults,
    activeTuple,
    activeColorFormat,
    lastApplied,
    onApplyPreset: applyPreset,
    onSelectAxis: setAxis,
    onSelectColorFormat: (next: string) => updateGlobals({ [COLOR_FORMAT_GLOBAL_KEY]: next }),
    onKeyDown: handleKeyDown,
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

  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Design Tokens',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => h(DesignTokensPanel, { active: !!active }),
  });
});
