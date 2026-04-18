import React, { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { IconButton, TooltipLinkList, WithTooltip } from 'storybook/internal/components';
import { addons, types, useGlobals, useStorybookApi } from 'storybook/manager-api';
import {
  ADDON_ID,
  AXES_GLOBAL_KEY,
  GLOBAL_KEY,
  INIT_EVENT,
  PANEL_DIAGNOSTICS_TAB,
  PANEL_TOKENS_TAB,
  TOOL_ID,
} from '#/constants.ts';
import { DiagnosticsPanel, TokensPanel } from '#/panel.tsx';

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

interface InitPayload {
  axes: readonly AxisEntry[];
  themes: ThemeEntry[];
  defaultTheme: string | null;
}

const EMPTY_AXES: readonly AxisEntry[] = [];
const EMPTY_THEMES: ThemeEntry[] = [];

function ThemeIcon(): ReactElement {
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

interface AxisDropdownProps {
  axis: AxisEntry;
  active: string;
  onSelect: (next: string) => void;
}

function AxisDropdown({ axis, active, onSelect }: AxisDropdownProps): ReactElement {
  const label = displayLabelFor(axis);
  const title = axis.description ? `${label} — ${axis.description}` : label;

  const tooltip = ({ onHide }: { onHide: () => void }): ReactElement =>
    h(
      'div',
      { style: { minWidth: 200 } },
      h(
        'div',
        {
          style: {
            padding: '8px 12px',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            opacity: 0.6,
          },
        },
        label,
      ),
      axis.description
        ? h(
            'div',
            {
              style: {
                padding: '0 12px 8px',
                fontSize: 12,
                opacity: 0.7,
                lineHeight: 1.4,
              },
            },
            axis.description,
          )
        : null,
      h(TooltipLinkList, {
        links: axis.contexts.map((ctx) => ({
          id: ctx,
          title: ctx,
          active: ctx === active,
          onClick: () => {
            onSelect(ctx);
            onHide();
          },
        })),
      }),
    );

  return h(WithTooltip, {
    placement: 'bottom',
    trigger: 'click',
    closeOnOutsideClick: true,
    tooltip,
    children: h(
      IconButton,
      { key: `${TOOL_ID}/${axis.name}`, title },
      h(ThemeIcon),
      h('span', { style: { marginLeft: 6 } }, `${label}: ${active}`),
    ),
  });
}

function AxesToolbar(): ReactElement {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();
  const [payload, setPayload] = useState<InitPayload | null>(null);

  useEffect(() => {
    const channel = addons.getChannel();
    const onInit = (next: InitPayload): void => setPayload(next);
    channel.on(INIT_EVENT, onInit);
    return () => {
      channel.off(INIT_EVENT, onInit);
    };
  }, []);

  const axes = payload?.axes ?? EMPTY_AXES;
  const themes = payload?.themes ?? EMPTY_THEMES;
  const defaults = useMemo(() => defaultTupleFor(axes), [axes]);
  const globalTuple = globals[AXES_GLOBAL_KEY] as Record<string, string> | undefined;

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

  if (axes.length === 0) {
    return h(
      IconButton,
      { key: TOOL_ID, title: 'Swatchbook theme (loading…)', disabled: true },
      h(ThemeIcon),
      h('span', { style: { marginLeft: 6, opacity: 0.6 } }, '—'),
    );
  }

  return h(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center', gap: 4 } },
    ...axes.map((axis) =>
      h(AxisDropdown, {
        key: axis.name,
        axis,
        active: activeTuple[axis.name] ?? axis.default,
        onSelect: (next: string) => setAxis(axis.name, next),
      }),
    ),
  );
}

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Swatchbook theme',
    match: ({ viewMode, tabId }) => !tabId && (viewMode === 'story' || viewMode === 'docs'),
    render: () => h(AxesToolbar),
  });

  addons.add(PANEL_TOKENS_TAB, {
    type: types.PANEL,
    title: 'Swatchbook tokens',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => h(TokensPanel, { active: !!active }),
  });

  addons.add(PANEL_DIAGNOSTICS_TAB, {
    type: types.PANEL,
    title: 'Swatchbook diagnostics',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => h(DiagnosticsPanel, { active: !!active }),
  });
});
