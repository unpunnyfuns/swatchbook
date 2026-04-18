import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { Placeholder, ScrollArea } from 'storybook/internal/components';
import { addons, useGlobals } from 'storybook/manager-api';
import { AXES_GLOBAL_KEY, GLOBAL_KEY, INIT_EVENT } from '#/constants.ts';

/** `React.createElement` alias so the manager bundle avoids `react/jsx-runtime`. */
const h = React.createElement;

interface VirtualToken {
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

function makeCssVarName(path: string, prefix: string): string {
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
    if (typeof v['hex'] === 'string') return v['hex'] as string;
    if ('value' in v && 'unit' in v) return `${String(v['value'])}${String(v['unit'])}`;
    return JSON.stringify(value).slice(0, 80);
  }
  return String(value);
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const headerStyle: CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid rgba(128,128,128,0.2)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const axisIndicatorStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  opacity: 0.7,
};

const treeWrapperStyle: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  padding: 8,
};

const groupRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 6px',
  borderRadius: 4,
  cursor: 'pointer',
  userSelect: 'none',
};

const leafRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 6px',
  borderRadius: 4,
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  width: '100%',
  textAlign: 'left',
  fontFamily: 'inherit',
  fontSize: 'inherit',
};

const caretStyle: CSSProperties = {
  display: 'inline-block',
  width: 12,
  textAlign: 'center',
  opacity: 0.6,
};

const treeUlStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 };

const nestedUlStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  paddingLeft: 18,
  borderLeft: '1px solid rgba(128,128,128,0.2)',
};

const typePillStyle: CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  borderRadius: 4,
  fontSize: 10,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  background: 'rgba(128,128,128,0.15)',
};

const valueStyle: CSSProperties = {
  marginLeft: 'auto',
  opacity: 0.7,
  fontSize: 11,
  maxWidth: '40%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const countStyle: CSSProperties = {
  marginLeft: 'auto',
  fontSize: 11,
  opacity: 0.7,
};

const swatchStyle: CSSProperties = {
  display: 'inline-block',
  width: 14,
  height: 14,
  borderRadius: 3,
  border: '1px solid rgba(128,128,128,0.3)',
  marginLeft: 8,
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  fontSize: 12,
  border: '1px solid rgba(128,128,128,0.3)',
  borderRadius: 4,
  background: 'transparent',
  color: 'inherit',
};

interface LeafNode {
  kind: 'leaf';
  segment: string;
  path: string;
  token: VirtualToken;
}

interface GroupNode {
  kind: 'group';
  segment: string;
  path: string;
  children: TreeNode[];
}

type TreeNode = LeafNode | GroupNode;

function buildTree(resolved: Record<string, VirtualToken>): TreeNode[] {
  const rootNode: GroupNode = { kind: 'group', segment: '', path: '', children: [] };
  for (const [path, token] of Object.entries(resolved)) {
    const segments = path.split('.');
    let node: GroupNode = rootNode;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg = segments[i] as string;
      const prefix = segments.slice(0, i + 1).join('.');
      let child = node.children.find(
        (c): c is GroupNode => c.kind === 'group' && c.segment === seg,
      );
      if (!child) {
        child = { kind: 'group', segment: seg, path: prefix, children: [] };
        node.children.push(child);
      }
      node = child;
    }
    const leafSegment = segments[segments.length - 1] as string;
    node.children.push({ kind: 'leaf', segment: leafSegment, path, token });
  }
  sortTree(rootNode);
  return rootNode.children;
}

function sortTree(node: GroupNode): void {
  node.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'group' ? -1 : 1;
    return a.segment.localeCompare(b.segment);
  });
  for (const c of node.children) {
    if (c.kind === 'group') sortTree(c);
  }
}

function collectInitialExpanded(nodes: TreeNode[], remainingDepth: number, out: Set<string>): void {
  if (remainingDepth <= 0) return;
  for (const node of nodes) {
    if (node.kind !== 'group') continue;
    out.add(node.path);
    collectInitialExpanded(node.children, remainingDepth - 1, out);
  }
}

function countLeaves(node: TreeNode): number {
  if (node.kind === 'leaf') return 1;
  let n = 0;
  for (const c of node.children) n += countLeaves(c);
  return n;
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;
  const out: TreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === 'leaf') {
      if (node.path.toLowerCase().includes(query)) out.push(node);
      continue;
    }
    const filteredChildren = filterTree(node.children, query);
    if (filteredChildren.length > 0) {
      out.push({ ...node, children: filteredChildren });
    }
  }
  return out;
}

function collectAllGroupPaths(nodes: TreeNode[], out: Set<string>): void {
  for (const node of nodes) {
    if (node.kind === 'group') {
      out.add(node.path);
      collectAllGroupPaths(node.children, out);
    }
  }
}

interface PanelProps {
  active: boolean;
}

export function DesignTokensPanel({ active }: PanelProps): ReactElement | null {
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

  const tree = useMemo(() => buildTree(tokens), [tokens]);
  const lowerQuery = query.toLowerCase();
  const filtered = useMemo(() => filterTree(tree, lowerQuery), [tree, lowerQuery]);

  const initialExpanded = useMemo(() => {
    const out = new Set<string>();
    collectInitialExpanded(tree, 1, out);
    return out;
  }, [tree]);

  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);
  useEffect(() => {
    setExpanded(initialExpanded);
  }, [initialExpanded]);

  // When searching, expand every matching group so hits are visible.
  const displayExpanded = useMemo(() => {
    if (!lowerQuery) return expanded;
    const all = new Set<string>();
    collectAllGroupPaths(filtered, all);
    return all;
  }, [expanded, filtered, lowerQuery]);

  const toggle = useCallback((path: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleLeafClick = useCallback(
    (path: string) => {
      const varName = makeCssVarName(path, prefix);
      void copy(`var(${varName})`);
    },
    [prefix],
  );

  if (!active) return null;

  if (!payload) {
    return h(Placeholder, null, 'Waiting for swatchbook preview…');
  }

  const showAxisIndicator =
    axes.length > 1 || (axes.length === 1 && axes[0]?.source !== 'synthetic');
  const axisIndicatorText = axes
    .map((axis) => `${axis.name}: ${tuple[axis.name] ?? axis.default}`)
    .join('  ·  ');
  const disabledAxes = payload?.disabledAxes ?? [];
  const pinnedSample = themes[0]?.input ?? {};
  const disabledIndicatorText = disabledAxes
    .map((name) => `${name}: ${pinnedSample[name] ?? '?'} · pinned`)
    .join('  ·  ');

  return h(
    'div',
    { style: containerStyle },
    h(
      'div',
      { style: headerStyle },
      showAxisIndicator &&
        h(
          'div',
          {
            style: axisIndicatorStyle,
            'data-testid': 'design-tokens-panel-axis-indicator',
          },
          axisIndicatorText,
        ),
      disabledAxes.length > 0 &&
        h(
          'div',
          {
            style: { ...axisIndicatorStyle, opacity: 0.5 },
            'data-testid': 'design-tokens-panel-disabled-axes-indicator',
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
      filtered.length === 0
        ? h(Placeholder, null, query ? 'No tokens match this filter.' : 'No tokens in this theme.')
        : h(
            'div',
            { style: treeWrapperStyle },
            h(
              'ul',
              { style: treeUlStyle, role: 'tree' },
              filtered.map((node) =>
                h(TreeRow, {
                  key: node.path || node.segment,
                  node,
                  expanded: displayExpanded,
                  onToggle: toggle,
                  onLeafClick: handleLeafClick,
                  prefix,
                }),
              ),
            ),
          ),
      h(DiagnosticsSection, { diagnostics: payload.diagnostics }),
    ),
  );
}

interface TreeRowProps {
  node: TreeNode;
  expanded: Set<string>;
  onToggle(path: string): void;
  onLeafClick(path: string): void;
  prefix: string;
}

function TreeRow({ node, expanded, onToggle, onLeafClick, prefix }: TreeRowProps): ReactElement {
  if (node.kind === 'leaf') {
    return h(LeafRow, { node, onLeafClick, prefix });
  }
  const isOpen = expanded.has(node.path);
  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(node.path);
    }
  };
  return h(
    'li',
    { role: 'treeitem', 'aria-expanded': isOpen },
    h(
      'div',
      {
        role: 'button',
        tabIndex: 0,
        style: groupRowStyle,
        onClick: () => onToggle(node.path),
        onKeyDown: onKey,
        'data-path': node.path,
        'data-testid': 'design-tokens-panel-group',
      },
      h('span', { style: caretStyle, 'aria-hidden': true }, isOpen ? '▾' : '▸'),
      h('span', null, node.segment),
      h('span', { style: countStyle }, countLeaves(node)),
    ),
    isOpen &&
      h(
        'ul',
        { style: nestedUlStyle, role: 'group' },
        node.children.map((c) =>
          h(TreeRow, {
            key: c.path || c.segment,
            node: c,
            expanded,
            onToggle,
            onLeafClick,
            prefix,
          }),
        ),
      ),
  );
}

interface LeafRowProps {
  node: LeafNode;
  onLeafClick(path: string): void;
  prefix: string;
}

function LeafRow({ node, onLeafClick, prefix }: LeafRowProps): ReactElement {
  const type = node.token.$type ?? '';
  const value = node.token.$value;
  const displayValue = formatValue(value);
  const isColor = type === 'color' && typeof value === 'object' && value !== null;
  const colorPreview =
    isColor && typeof (value as Record<string, unknown>)['hex'] === 'string'
      ? ((value as Record<string, unknown>)['hex'] as string)
      : null;

  const varName = makeCssVarName(node.path, prefix);

  return h(
    'li',
    { role: 'treeitem' },
    h(
      'button',
      {
        type: 'button',
        style: leafRowStyle,
        onClick: () => onLeafClick(node.path),
        title: `Click to copy var(${varName})`,
        'data-path': node.path,
        'data-testid': 'design-tokens-panel-leaf',
      },
      h('span', { style: caretStyle, 'aria-hidden': true }, '•'),
      h('span', null, node.segment),
      type && h('span', { style: typePillStyle }, type),
      h('span', { style: valueStyle }, displayValue),
      colorPreview &&
        h('span', {
          style: { ...swatchStyle, background: colorPreview },
          'aria-hidden': true,
        }),
    ),
  );
}

const severityStyle: Record<DiagnosticSeverity, CSSProperties> = {
  error: { color: '#d64545' },
  warn: { color: '#b08900' },
  info: { opacity: 0.6 },
};

const severityLabel: Record<DiagnosticSeverity, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
};

const diagnosticsSectionStyle: CSSProperties = {
  borderTop: '1px solid rgba(128,128,128,0.2)',
  marginTop: 8,
};

const diagnosticsSummaryStyle: CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  cursor: 'pointer',
  userSelect: 'none',
  listStyle: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const diagnosticRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '60px 1fr',
  gap: 12,
  padding: '8px 12px',
  fontSize: 12,
  borderTop: '1px solid rgba(128,128,128,0.12)',
};

interface DiagnosticsSectionProps {
  diagnostics: readonly VirtualDiagnostic[];
}

function DiagnosticsSection({ diagnostics }: DiagnosticsSectionProps): ReactElement {
  const counts = diagnostics.reduce(
    (acc, d) => {
      acc[d.severity] = (acc[d.severity] ?? 0) + 1;
      return acc;
    },
    { error: 0, warn: 0, info: 0 } as Record<DiagnosticSeverity, number>,
  );

  const hasErrorsOrWarnings = counts.error > 0 || counts.warn > 0;

  const summaryText = (() => {
    if (diagnostics.length === 0) return '✔ OK · no diagnostics';
    const parts: string[] = [];
    if (counts.error > 0) parts.push(`✖ ${counts.error} error${counts.error === 1 ? '' : 's'}`);
    if (counts.warn > 0) parts.push(`⚠ ${counts.warn} warning${counts.warn === 1 ? '' : 's'}`);
    if (counts.info > 0) parts.push(`${counts.info} info`);
    return parts.join(' · ');
  })();

  const summaryColor = (() => {
    if (diagnostics.length === 0) return '#30a46c';
    if (counts.error > 0) return '#d64545';
    if (counts.warn > 0) return '#b08900';
    return 'inherit';
  })();

  return h(
    'details',
    {
      style: diagnosticsSectionStyle,
      open: hasErrorsOrWarnings,
      'data-testid': 'design-tokens-panel-diagnostics',
    },
    h(
      'summary',
      { style: { ...diagnosticsSummaryStyle, color: summaryColor, fontWeight: 600 } },
      h('span', null, 'Diagnostics'),
      h('span', { style: { fontWeight: 400 } }, summaryText),
    ),
    diagnostics.length === 0
      ? null
      : h(
          'div',
          null,
          diagnostics.map((d, i) =>
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
