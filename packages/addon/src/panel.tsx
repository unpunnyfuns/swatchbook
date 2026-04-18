import React, { useEffect, useMemo, useState, type ReactElement } from 'react';
import { addons, useGlobals } from 'storybook/manager-api';
import { Placeholder, ScrollArea } from 'storybook/internal/components';
import { AXES_GLOBAL_KEY, GLOBAL_KEY, INIT_EVENT } from '#/constants.ts';

/** `React.createElement` alias so the manager bundle avoids `react/jsx-runtime`. */
const h = React.createElement;

interface VirtualToken {
  id: string;
  $type?: string;
  $value?: unknown;
  $description?: string;
}

interface VirtualTheme {
  name: string;
  input: Record<string, string>;
  sources: string[];
}

interface VirtualAxis {
  name: string;
  contexts: readonly string[];
  default: string;
  description?: string;
  source: 'resolver' | 'synthetic';
}

type DiagnosticSeverity = 'error' | 'warn' | 'info';

interface VirtualDiagnostic {
  severity: DiagnosticSeverity;
  group: string;
  message: string;
  filename?: string;
  line?: number;
  column?: number;
}

interface InitPayload {
  axes: VirtualAxis[];
  disabledAxes: readonly string[];
  themes: VirtualTheme[];
  defaultTheme: string | null;
  themesResolved: Record<string, Record<string, VirtualToken>>;
  diagnostics: VirtualDiagnostic[];
  cssVarPrefix: string;
}

function usePayload(): InitPayload | null {
  const [payload, setPayload] = useState<InitPayload | null>(null);
  useEffect(() => {
    const channel = addons.getChannel();
    const onInit = (next: InitPayload): void => setPayload(next);
    channel.on(INIT_EVENT, onInit);
    return () => {
      channel.off(INIT_EVENT, onInit);
    };
  }, []);
  return payload;
}

function makeCssVar(path: string, prefix: string): string {
  const tail = path.replaceAll('.', '-');
  return prefix ? `--${prefix}-${tail}` : `--${tail}`;
}

async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard access denied — no fallback, the user can read the var name from the row */
  }
}

/** Format a token `$value` into a short display string. */
function formatValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    // Color with hex
    if (typeof v['hex'] === 'string') return v['hex'] as string;
    // Dimension / duration { value, unit }
    if ('value' in v && 'unit' in v) return `${String(v['value'])}${String(v['unit'])}`;
    // Fallback: JSON-ish single line
    return JSON.stringify(value).slice(0, 80);
  }
  return String(value);
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 12,
  padding: '6px 12px',
  fontSize: 12,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  borderBottom: '1px solid rgba(128,128,128,0.12)',
  cursor: 'pointer',
};

const pathStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis' };
const valueStyle: React.CSSProperties = { opacity: 0.7, whiteSpace: 'nowrap' };
const groupHeaderStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  opacity: 0.6,
  position: 'sticky',
  top: 0,
  background: 'inherit',
};
const searchBarStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid rgba(128,128,128,0.2)',
};
const axisIndicatorStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  opacity: 0.7,
  marginBottom: 6,
};
const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  fontSize: 12,
  border: '1px solid rgba(128,128,128,0.3)',
  borderRadius: 4,
  background: 'transparent',
  color: 'inherit',
};

function groupByType(tokens: Record<string, VirtualToken>): Map<string, VirtualToken[]> {
  const groups = new Map<string, VirtualToken[]>();
  for (const [path, token] of Object.entries(tokens)) {
    const type = token.$type ?? 'unknown';
    const arr = groups.get(type) ?? [];
    arr.push({ ...token, id: path });
    groups.set(type, arr);
  }
  // Sort groups by name, tokens within each group by path.
  return new Map(
    [...groups.entries()]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, v.toSorted((a, b) => a.id.localeCompare(b.id))]),
  );
}

interface PanelProps {
  active: boolean;
}

export function TokensPanel({ active }: PanelProps): ReactElement | null {
  const payload = usePayload();
  const [globals] = useGlobals();
  const [query, setQuery] = useState('');

  const axes = useMemo(() => payload?.axes ?? [], [payload]);
  const themes = useMemo(() => payload?.themes ?? [], [payload]);
  const globalAxes = globals[AXES_GLOBAL_KEY] as Record<string, string> | undefined;
  const globalTheme = globals[GLOBAL_KEY] as string | undefined;

  const tuple: Record<string, string> = useMemo(() => {
    const out: Record<string, string> = {};
    for (const axis of axes) out[axis.name] = axis.default;
    if (globalAxes && typeof globalAxes === 'object') {
      for (const axis of axes) {
        const candidate = globalAxes[axis.name];
        if (candidate && axis.contexts.includes(candidate)) out[axis.name] = candidate;
      }
      return out;
    }
    if (globalTheme) {
      const match = themes.find((t) => t.name === globalTheme);
      if (match) {
        for (const axis of axes) {
          const candidate = match.input[axis.name];
          if (candidate && axis.contexts.includes(candidate)) out[axis.name] = candidate;
        }
      }
    }
    return out;
  }, [axes, themes, globalAxes, globalTheme]);

  const themeName = useMemo(() => {
    const match = themes.find((t) => {
      const input = t.input;
      return Object.keys(input).every((k) => input[k] === tuple[k]);
    });
    return match?.name ?? globalTheme ?? payload?.defaultTheme ?? '';
  }, [themes, tuple, globalTheme, payload]);

  const prefix = payload?.cssVarPrefix ?? '';
  const tokens = useMemo(() => payload?.themesResolved[themeName] ?? {}, [payload, themeName]);
  const tokenCount = Object.keys(tokens).length;

  const grouped = useMemo(() => groupByType(tokens), [tokens]);
  const lowerQuery = query.toLowerCase();
  const filtered = useMemo(() => {
    if (!lowerQuery) return grouped;
    const out = new Map<string, VirtualToken[]>();
    for (const [type, list] of grouped) {
      const matches = list.filter((t) => t.id.toLowerCase().includes(lowerQuery));
      if (matches.length > 0) out.set(type, matches);
    }
    return out;
  }, [grouped, lowerQuery]);

  if (!active) return null;

  if (!payload) {
    return h(Placeholder, null, 'Waiting for swatchbook preview…');
  }

  const totalMatches = [...filtered.values()].reduce((n, l) => n + l.length, 0);

  const showAxisIndicator =
    axes.length > 1 || (axes.length === 1 && axes[0]?.source !== 'synthetic');
  const axisIndicatorText = axes
    .map((axis) => `${axis.name}: ${tuple[axis.name] ?? axis.default}`)
    .join('  ·  ');
  const disabledAxes = payload?.disabledAxes ?? [];
  /**
   * Disabled axes don't appear in `axes` (filtered at load time) so their
   * values aren't in `tuple` either. The surviving themes still carry the
   * pinned value on their `input`, so pick any theme and read it out.
   */
  const pinnedSample = themes[0]?.input ?? {};
  const disabledIndicatorText = disabledAxes
    .map((name) => `${name}: ${pinnedSample[name] ?? '?'} · pinned`)
    .join('  ·  ');

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(
      'div',
      { style: searchBarStyle },
      showAxisIndicator &&
        h(
          'div',
          {
            style: axisIndicatorStyle,
            'data-testid': 'tokens-panel-axis-indicator',
          },
          axisIndicatorText,
        ),
      disabledAxes.length > 0 &&
        h(
          'div',
          {
            style: { ...axisIndicatorStyle, opacity: 0.5 },
            'data-testid': 'tokens-panel-disabled-axes-indicator',
          },
          disabledIndicatorText,
        ),
      h('input', {
        style: searchInputStyle,
        type: 'search',
        placeholder: `Search ${tokenCount} tokens in ${themeName}…`,
        value: query,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
      }),
    ),
    h(
      ScrollArea,
      { vertical: true },
      totalMatches === 0
        ? h(Placeholder, null, 'No tokens match this filter.')
        : [...filtered.entries()].map(([type, list]) =>
            h(
              'section',
              { key: type },
              h('header', { style: groupHeaderStyle }, type, ` · ${list.length}`),
              list.map((token) => {
                const cssVar = makeCssVar(token.id, prefix);
                return h(
                  'button',
                  {
                    key: token.id,
                    type: 'button',
                    style: rowStyle,
                    title: `Click to copy var(${cssVar})`,
                    onClick: () => void copy(`var(${cssVar})`),
                  },
                  h('span', { style: pathStyle }, token.id),
                  h('span', { style: valueStyle }, formatValue(token.$value)),
                );
              }),
            ),
          ),
    ),
  );
}

const severityStyle: Record<DiagnosticSeverity, React.CSSProperties> = {
  error: { color: '#d64545' },
  warn: { color: '#b08900' },
  info: { opacity: 0.6 },
};

const severityLabel: Record<DiagnosticSeverity, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
};

const diagnosticRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '60px 1fr',
  gap: 12,
  padding: '8px 12px',
  fontSize: 12,
  borderBottom: '1px solid rgba(128,128,128,0.12)',
};

export function DiagnosticsPanel({ active }: PanelProps): ReactElement | null {
  const payload = usePayload();

  if (!active) return null;

  if (!payload) {
    return h(Placeholder, null, 'Waiting for swatchbook preview…');
  }

  const counts = payload.diagnostics.reduce(
    (acc, d) => {
      acc[d.severity] = (acc[d.severity] ?? 0) + 1;
      return acc;
    },
    { error: 0, warn: 0, info: 0 } as Record<DiagnosticSeverity, number>,
  );

  if (payload.diagnostics.length === 0) {
    return h(
      Placeholder,
      null,
      h('strong', null, 'All clear ✓'),
      h('span', { style: { display: 'block', marginTop: 8, opacity: 0.7 } }, 'No diagnostics.'),
    );
  }

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h(
      'header',
      { style: { ...searchBarStyle, display: 'flex', gap: 16, fontSize: 11 } },
      h('span', severityStyle.error, `${counts.error} errors`),
      h('span', severityStyle.warn, `${counts.warn} warnings`),
      h('span', severityStyle.info, `${counts.info} info`),
    ),
    h(
      ScrollArea,
      { vertical: true },
      payload.diagnostics.map((d, i) =>
        h(
          'div',
          { key: `${d.group}-${i}`, style: diagnosticRowStyle },
          h(
            'span',
            { style: { ...severityStyle[d.severity], fontWeight: 600, fontSize: 10 } },
            severityLabel[d.severity],
          ),
          h(
            'div',
            null,
            h('div', null, d.message),
            (d.filename || d.group) &&
              h(
                'div',
                { style: { opacity: 0.5, fontSize: 10, marginTop: 4 } },
                [d.group, d.filename, d.line ? `:${d.line}` : ''].filter(Boolean).join(' · '),
              ),
          ),
        ),
      ),
    ),
  );
}
