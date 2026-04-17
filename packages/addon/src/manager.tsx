import React, { useEffect, useMemo, useState, type ReactElement } from 'react';
import { IconButton, TooltipLinkList, WithTooltip } from 'storybook/internal/components';
import { addons, types, useGlobals, useStorybookApi } from 'storybook/manager-api';
import {
  ADDON_ID,
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

interface ThemeEntry {
  name: string;
  input: Record<string, string>;
  sources: string[];
}

type ThemingMode = 'layered' | 'resolver';

interface InitPayload {
  themes: ThemeEntry[];
  defaultTheme: string | null;
  mode: ThemingMode;
}

const modeBadge: Record<ThemingMode, string> = {
  layered: 'layered',
  resolver: 'DTCG resolver',
};

const EMPTY_THEMES: ThemeEntry[] = [];

/** Split a resolver permutation like `{ appearance: 'light', brand: 'a' }` into display chips. */
function chipsFor(theme: ThemeEntry): string[] {
  const entries = Object.entries(theme.input);
  // Layered / manifest modes use a single-key { theme: name } — the name itself is the chip.
  if (entries.length === 1 && entries[0]?.[0] === 'theme') return [];
  return entries.map(([key, value]) => `${key}: ${value}`);
}

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

function ThemeToolbar(): ReactElement {
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

  const themes = payload?.themes ?? EMPTY_THEMES;
  const active =
    (globals[GLOBAL_KEY] as string | undefined) ?? payload?.defaultTheme ?? themes[0]?.name ?? '';

  const selectTheme = useMemo(
    () =>
      (name: string): void => {
        updateGlobals({ [GLOBAL_KEY]: name });
      },
    [updateGlobals],
  );

  useEffect(() => {
    if (themes.length === 0) return;
    api.setAddonShortcut(ADDON_ID, {
      label: 'Cycle swatchbook theme',
      defaultShortcut: ['alt', 'T'],
      actionName: 'cycleTheme',
      showInMenu: true,
      action: () => {
        const idx = themes.findIndex((t) => t.name === active);
        const next = themes[(idx + 1) % themes.length];
        if (next) selectTheme(next.name);
      },
    });
  }, [api, themes, active, selectTheme]);

  if (themes.length === 0) {
    return h(
      IconButton,
      { key: TOOL_ID, title: 'Swatchbook theme (loading…)', disabled: true },
      h(ThemeIcon),
      h('span', { style: { marginLeft: 6, opacity: 0.6 } }, '—'),
    );
  }

  const tooltip = ({ onHide }: { onHide: () => void }): ReactElement =>
    h(
      'div',
      { style: { minWidth: 220 } },
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
        `Theme${payload?.mode ? ` — ${modeBadge[payload.mode]}` : ''}`,
      ),
      h(TooltipLinkList, {
        links: themes.map((theme) => ({
          id: theme.name,
          title: theme.name,
          right: chipsFor(theme).join(' · ') || undefined,
          active: theme.name === active,
          onClick: () => {
            selectTheme(theme.name);
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
      { key: TOOL_ID, title: 'Swatchbook theme' },
      h(ThemeIcon),
      h('span', { style: { marginLeft: 6 } }, active),
    ),
  });
}

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Swatchbook theme',
    match: ({ viewMode, tabId }) => !tabId && (viewMode === 'story' || viewMode === 'docs'),
    render: () => h(ThemeToolbar),
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
