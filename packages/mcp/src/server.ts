import type { Project, TokenMap } from '@unpunnyfuns/swatchbook-core';
import { emitAxisProjectedCss } from '@unpunnyfuns/swatchbook-core';
import { fuzzyFilter, fuzzyMatches } from '@unpunnyfuns/swatchbook-core/fuzzy';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { computeContrast } from '#/contrast.ts';
import { formatColorEveryWay } from '#/format-color.ts';
import { matchPath } from '#/match.ts';

/**
 * Build a swatchbook MCP server bound to a loaded project. Tools expose the
 * project's tokens, axes, and diagnostics so an AI agent can query them
 * without running Storybook. Tool handlers close over a live `project`
 * reference — call the returned `setProject` to swap in a freshly loaded
 * project (e.g. after token edits) without re-binding the transport.
 */
export function createServer(initial: Project): McpServer & {
  setProject: (next: Project) => void;
} {
  let project = initial;
  // Reverse lookup `themeName → axisTuple`, refreshed on each
  // `setProject` swap. Tool handlers that accept a `theme` name
  // parameter use this to map it to a tuple in O(1) before calling
  // `project.resolveAt(tuple)`. The set carries the default tuple +
  // every singleton (one per non-default cell on each axis) + every
  // preset — enumerated from `axes` + `presets` + `defaultTuple`
  // independently of the soon-to-be-removed `Project.permutations`
  // field.
  let tupleByName = buildTupleByName(initial);
  let defaultThemeName = tupleToName(initial.axes, initial.defaultTuple);
  const server = new McpServer(
    {
      name: '@unpunnyfuns/swatchbook-mcp',
      version: project.config.cssVarPrefix ? `project:${project.config.cssVarPrefix}` : 'project',
    },
    {
      instructions:
        'Query a swatchbook DTCG project: list tokens by path glob, inspect individual tokens (value, $type, alias chain, per-theme resolved values), read axes / presets, and inspect diagnostics.',
    },
  ) as McpServer & { setProject: (next: Project) => void };
  server.setProject = (next: Project) => {
    project = next;
    tupleByName = buildTupleByName(next);
    defaultThemeName = tupleToName(next.axes, next.defaultTuple);
  };

  /**
   * Resolve tokens for a `theme` name parameter. Falls back to the
   * project's default tuple when the name doesn't match any known
   * theme (also covers the no-theme-provided path).
   */
  const tokensForTheme = (themeName: string | undefined): TokenMap => {
    const tuple =
      (themeName !== undefined ? tupleByName.get(themeName) : undefined) ?? project.defaultTuple;
    return project.resolveAt(tuple);
  };

  /**
   * Iterate every `(themeName, tuple)` pair the project surfaces —
   * default + singletons + presets — without going through
   * `project.permutations`. Order is insertion order of `tupleByName`
   * (default first, then singletons per axis, then presets).
   */
  const eachTheme = function* (): Generator<{ name: string; tuple: Record<string, string> }> {
    for (const [name, tuple] of tupleByName) yield { name, tuple };
  };

  server.registerTool(
    'describe_project',
    {
      description:
        'High-level summary of the project — total token count per theme, axes (with contexts) and how they compose, preset list, diagnostic counts by severity, css-var prefix, and the DTCG `$type`s present. Good first call for an agent that needs an orientation before querying specifics.',
      inputSchema: {},
    },
    () => {
      const typeCounts: Record<string, number> = {};
      const tokensPerTheme: Record<string, number> = {};
      for (const { name, tuple } of eachTheme()) {
        const tokens = project.resolveAt(tuple);
        tokensPerTheme[name] = Object.keys(tokens).length;
        for (const token of Object.values(tokens)) {
          if (token.$type) typeCounts[token.$type] = (typeCounts[token.$type] ?? 0) + 1;
        }
      }
      const diagBySeverity = { error: 0, warn: 0, info: 0 } as Record<string, number>;
      for (const d of project.diagnostics) {
        diagBySeverity[d.severity] = (diagBySeverity[d.severity] ?? 0) + 1;
      }
      return jsonResult({
        cssVarPrefix: project.config.cssVarPrefix ?? '',
        axes: project.axes.map((a) => ({ name: a.name, contexts: a.contexts, default: a.default })),
        permutations: [...tupleByName.keys()],
        defaultPermutation: defaultThemeName,
        presets: project.presets.map((p) => p.name),
        tokensPerTheme,
        types: typeCounts,
        diagnostics: {
          counts: diagBySeverity,
          total: project.diagnostics.length,
        },
      });
    },
  );

  server.registerTool(
    'emit_css',
    {
      description:
        'Return the full project CSS — a `:root` baseline + per-axis singleton cells (`[data-<prefix>-<axis>="<context>"]`) + compound joint-override blocks for tokens whose value at a multi-axis combination diverges from cascade composition + a trailing chrome alias block. Same output the addon injects into Storybook and the docs-site chrome pipeline writes to disk. Useful when an agent needs to inline the stylesheet into a generated artifact.',
      inputSchema: {},
    },
    () => textResult(emitAxisProjectedCss(project)),
  );

  server.registerTool(
    'list_tokens',
    {
      description:
        'List token paths in the project, optionally filtered by path glob (`color.*`, `color.palette.**`) and/or DTCG `$type` (color, dimension, typography, …). Returns path + $type + stringified value from the default theme. Use this first to discover what tokens exist; follow with get_token for details.',
      inputSchema: {
        filter: z
          .string()
          .optional()
          .describe('Dot-path glob, e.g. `color.*` or `color.palette.**`. Omit for all tokens.'),
        type: z
          .string()
          .optional()
          .describe('DTCG `$type` to scope the result, e.g. `color`, `dimension`, `typography`.'),
        theme: z
          .string()
          .optional()
          .describe('Permutation name to read values from. Defaults to the project default theme.'),
      },
    },
    ({ filter, type, theme }) => {
      const themeName = theme ?? defaultThemeName;
      const tokens = tokensForTheme(themeName);
      const rows: { path: string; type?: string; value: string }[] = [];
      for (const [path, token] of Object.entries(tokens)) {
        if (type && token.$type !== type) continue;
        if (!matchPath(path, filter)) continue;
        rows.push({
          path,
          ...(token.$type !== undefined && { type: token.$type }),
          value: stringifyValue(token.$value),
        });
      }
      rows.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
      return jsonResult({ theme: themeName, count: rows.length, tokens: rows });
    },
  );

  server.registerTool(
    'get_token',
    {
      description:
        'Get full details for a single token: resolved value in every theme, DTCG `$type`, `$description`, alias chain, aliased-by list, and CSS var reference. Use after `list_tokens` to inspect a specific path.',
      inputSchema: {
        path: z.string().describe('Dot-path of the token, e.g. `color.accent.bg`.'),
      },
    },
    ({ path }) => {
      const perTheme: Record<
        string,
        { value: string; aliasOf?: string; aliasChain?: readonly string[] }
      > = {};
      let type: string | undefined;
      let description: string | undefined;
      let aliasedBy: readonly string[] | undefined;
      let found = false;

      for (const { name, tuple } of eachTheme()) {
        const token = project.resolveAt(tuple)[path];
        if (!token) continue;
        found = true;
        type ??= token.$type;
        description ??= token.$description;
        aliasedBy ??= token.aliasedBy;
        perTheme[name] = {
          value: stringifyValue(token.$value),
          ...(token.aliasOf !== undefined && { aliasOf: token.aliasOf }),
          ...(token.aliasChain !== undefined && { aliasChain: token.aliasChain }),
        };
      }

      if (!found) return textResult(`Token not found: ${path}`);

      const prefix = project.config.cssVarPrefix ?? '';
      const cssVar = `var(--${prefix ? `${prefix}-` : ''}${path.replaceAll('.', '-')})`;

      return jsonResult({
        path,
        type,
        description,
        cssVar,
        aliasedBy,
        perTheme,
      });
    },
  );

  server.registerTool(
    'list_axes',
    {
      description:
        'List the project axes — each axis has a name, its contexts (discrete values like `Light` / `Dark`), a default, and a source (`resolver` for DTCG-resolver-driven, `layered` for authored layered axes, `synthetic` for single-theme projects). Also returns the named permutations (every axis tuple combination) and any presets defined in the project config.',
      inputSchema: {},
    },
    () =>
      jsonResult({
        axes: project.axes.map((axis) => ({
          name: axis.name,
          contexts: axis.contexts,
          default: axis.default,
          description: axis.description,
          source: axis.source,
        })),
        disabledAxes: project.disabledAxes,
        permutations: [...eachTheme()].map(({ name, tuple }) => ({ name, input: tuple })),
        presets: project.presets.map((p) => ({
          name: p.name,
          axes: p.axes,
          description: p.description,
        })),
      }),
  );

  server.registerTool(
    'get_alias_chain',
    {
      description:
        'Forward alias chain for a token — the sequence of paths it resolves through on the way to a primitive value (e.g. `color.accent.bg → color.brand.blue.700 → color.palette.blue.700`). Returns the chain per theme because aliases can resolve through different paths per axis context. Empty chain when the token is a primitive (no aliases) or missing.',
      inputSchema: {
        path: z.string().describe('Dot-path of the token, e.g. `color.accent.bg`.'),
      },
    },
    ({ path }) => {
      const perTheme: Record<string, { aliasOf?: string; chain: readonly string[] }> = {};
      let found = false;
      for (const { name, tuple } of eachTheme()) {
        const token = project.resolveAt(tuple)[path];
        if (!token) continue;
        found = true;
        const chain: string[] = [path];
        if (token.aliasChain && token.aliasChain.length > 0) chain.push(...token.aliasChain);
        else if (token.aliasOf) chain.push(token.aliasOf);
        perTheme[name] = {
          ...(token.aliasOf !== undefined && { aliasOf: token.aliasOf }),
          chain,
        };
      }
      if (!found) return textResult(`Token not found: ${path}`);
      return jsonResult({ path, perTheme });
    },
  );

  server.registerTool(
    'get_aliased_by',
    {
      description:
        'Backward alias tree for a token — every token that resolves through this path at any depth. Breadth-first walk with cycle protection; `maxDepth` caps recursion (default 6). Empty when nothing aliases the token.',
      inputSchema: {
        path: z.string().describe('Dot-path of the token, e.g. `color.palette.blue.500`.'),
        maxDepth: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Maximum recursion depth. Default 6.'),
      },
    },
    ({ path, maxDepth }) => {
      const depth = maxDepth ?? 6;
      const tokens = tokensForTheme(defaultThemeName);
      if (!tokens[path]) return textResult(`Token not found: ${path}`);

      interface Node {
        path: string;
        depth: number;
        children: Node[];
        truncated?: boolean;
      }
      const visited = new Set<string>([path]);
      const walk = (current: string, d: number): Node => {
        const tok = tokens[current];
        const direct = tok?.aliasedBy ?? [];
        if (direct.length === 0) return { path: current, depth: d, children: [] };
        if (d >= depth) return { path: current, depth: d, children: [], truncated: true };
        const children: Node[] = [];
        for (const p of direct) {
          if (visited.has(p)) continue;
          visited.add(p);
          children.push(walk(p, d + 1));
        }
        return { path: current, depth: d, children };
      };
      const root = walk(path, 0);
      return jsonResult(root);
    },
  );

  server.registerTool(
    'get_color_formats',
    {
      description:
        "For a color token, return its value rendered in every format the addon toolbar exposes — `hex`, `rgb`, `hsl`, `oklch`, and the raw JSON. Each entry carries an `outOfGamut` flag when the chosen colorspace can't losslessly represent the token (wide-gamut tokens rendered in sRGB, for example). Skips non-color tokens.",
      inputSchema: {
        path: z.string().describe('Dot-path of a color token, e.g. `color.accent.bg`.'),
        theme: z
          .string()
          .optional()
          .describe(
            'Permutation name to read the value from. Defaults to the project default theme.',
          ),
      },
    },
    ({ path, theme }) => {
      const themeName = theme ?? defaultThemeName;
      const token = tokensForTheme(themeName)[path];
      if (!token) return textResult(`Token not found: ${path}`);
      if (token.$type !== 'color') {
        return textResult(`Token ${path} is not a color (got $type=${token.$type ?? 'unknown'}).`);
      }
      return jsonResult({
        path,
        theme: themeName,
        formats: formatColorEveryWay(token.$value),
      });
    },
  );

  server.registerTool(
    'get_color_contrast',
    {
      description:
        'Compute the contrast between two color tokens for a given theme. WCAG 2.1 returns the ratio (1–21) plus AA/AAA pass flags for normal + large text; APCA returns the signed Lc value plus body / large-text / non-text pass flags (absolute-value thresholds 75 / 60 / 45). Use this when reasoning about text legibility, focus-ring visibility, border contrast, etc., without having to reimplement the luminance math in the agent. Per-theme so the same pair can be checked against Light, Dark, High-contrast, etc.',
      inputSchema: {
        foreground: z
          .string()
          .describe('Dot-path of the foreground color token, e.g. `color.text.default`.'),
        background: z
          .string()
          .describe('Dot-path of the background color token, e.g. `color.surface.default`.'),
        theme: z
          .string()
          .optional()
          .describe('Permutation name. Defaults to the project default theme.'),
        algorithm: z
          .enum(['wcag21', 'apca'])
          .optional()
          .describe(
            'Contrast algorithm. `wcag21` is the classic 4.5:1 ratio; `apca` is the perceptually-weighted Silver-draft successor. Defaults to `wcag21`.',
          ),
      },
    },
    ({ foreground, background, theme, algorithm }) => {
      const themeName = theme ?? defaultThemeName;
      const tokens = tokensForTheme(themeName);
      const fgTok = tokens[foreground];
      const bgTok = tokens[background];
      if (!fgTok) return textResult(`Foreground token not found: ${foreground}`);
      if (!bgTok) return textResult(`Background token not found: ${background}`);
      if (fgTok.$type !== 'color') {
        return textResult(
          `Foreground ${foreground} is not a color (got $type=${fgTok.$type ?? 'unknown'}).`,
        );
      }
      if (bgTok.$type !== 'color') {
        return textResult(
          `Background ${background} is not a color (got $type=${bgTok.$type ?? 'unknown'}).`,
        );
      }
      const result = computeContrast(fgTok.$value, bgTok.$value, algorithm ?? 'wcag21');
      if (!result) {
        return textResult(
          'Could not compute contrast — one or both values failed to parse as a color.',
        );
      }
      return jsonResult({
        theme: themeName,
        foreground: { path: foreground, value: stringifyValue(fgTok.$value) },
        background: { path: background, value: stringifyValue(bgTok.$value) },
        ...result,
      });
    },
  );

  server.registerTool(
    'get_axis_variance',
    {
      description:
        "Classify how a token's resolved value depends on the project's axes. Returns `kind` — `constant` (same across every tuple), `single` (varies with exactly one axis, e.g. mode only), or `multi` (varies across two or more axes). Also returns `varyingAxes` / `constantAcrossAxes` plus a `perAxis` breakdown with each context's stringified value (holding other axes at their defaults). Use when reasoning about whether a token is theme-independent, whether a refactor changed an axis dependency, or to confirm that (say) a role token only varies with `contrast`.",
      inputSchema: {
        path: z.string().describe('Dot-path of the token to analyse, e.g. `color.text.default`.'),
      },
    },
    ({ path }) => {
      const cached = project.varianceByPath.get(path);
      if (!cached) return textResult(`Token not found in any theme: ${path}`);
      return jsonResult(cached);
    },
  );

  server.registerTool(
    'search_tokens',
    {
      description:
        'Fuzzy search across token paths, `$description`, and stringified values. Case-insensitive, tolerates a single-character typo per term, and accepts out-of-order terms (`"blue palette"` finds `color.palette.blue.500`). Returns matches ranked by relevance with a short snippet pointing at where the match hit. Use when you know what you want but not the exact path. Scopes to a single theme (default: project default).',
      inputSchema: {
        query: z.string().min(1).describe('Fuzzy query (case-insensitive).'),
        theme: z
          .string()
          .optional()
          .describe('Permutation name to search within. Defaults to the project default.'),
        limit: z.number().int().positive().optional().describe('Cap the result count. Default 50.'),
      },
    },
    ({ query, theme, limit }) => {
      const themeName = theme ?? defaultThemeName;
      const tokens = tokensForTheme(themeName);
      const max = limit ?? 50;

      const candidates = Object.entries(tokens).map(([path, token]) => {
        const description = token.$description ?? '';
        const value = stringifyValue(token.$value);
        return { path, token, description, value, composite: `${path} ${description} ${value}` };
      });
      const ranked = fuzzyFilter(candidates, query, (c) => c.composite, { limit: max });
      const hits = ranked.map((c) => {
        const matchedIn: ('path' | 'description' | 'value')[] = [];
        if (fuzzyMatches(c.path, query)) matchedIn.push('path');
        if (c.description && fuzzyMatches(c.description, query)) matchedIn.push('description');
        if (fuzzyMatches(c.value, query)) matchedIn.push('value');
        if (matchedIn.length === 0) matchedIn.push('path');
        const snippet = matchedIn.includes('description')
          ? (c.token.$description ?? c.path)
          : matchedIn.includes('value')
            ? `${c.path} = ${c.value}`
            : c.path;
        const entry: { path: string; type?: string; matchedIn: typeof matchedIn; snippet: string } =
          {
            path: c.path,
            matchedIn,
            snippet,
          };
        if (c.token.$type !== undefined) entry.type = c.token.$type;
        return entry;
      });
      return jsonResult({
        query,
        theme: themeName,
        count: hits.length,
        truncated: hits.length === max,
        hits,
      });
    },
  );

  server.registerTool(
    'resolve_theme',
    {
      description:
        'Resolve the full token map for a given axis tuple. Agent passes a partial tuple (`{ mode: "Dark", brand: "Brand A" }`); any axis omitted falls back to that axis\'s default. Returns the matching theme name, the complete tuple after filling defaults, and the resolved `{ path: { value, type, aliasOf?, aliasChain? } }` map — effectively "what do all tokens look like if I pin this combination".',
      inputSchema: {
        tuple: z
          .record(z.string(), z.string())
          .describe('Partial axis tuple, e.g. `{ mode: "Dark", brand: "Brand A" }`.'),
        filter: z.string().optional().describe('Optional path glob to scope the returned map.'),
        type: z.string().optional().describe('Optional DTCG `$type` to scope the returned map.'),
      },
    },
    ({ tuple, filter, type }) => {
      const active: Record<string, string> = {};
      for (const axis of project.axes) {
        const candidate = tuple[axis.name];
        active[axis.name] =
          candidate && axis.contexts.includes(candidate) ? candidate : axis.default;
      }
      const themeName = tupleToName(project.axes, active);
      const tokens = project.resolveAt(active);
      const resolved: Record<
        string,
        { value: string; type?: string; aliasOf?: string; aliasChain?: readonly string[] }
      > = {};
      let count = 0;
      for (const [path, token] of Object.entries(tokens)) {
        if (type && token.$type !== type) continue;
        if (!matchPath(path, filter)) continue;
        resolved[path] = {
          value: stringifyValue(token.$value),
          ...(token.$type !== undefined && { type: token.$type }),
          ...(token.aliasOf !== undefined && { aliasOf: token.aliasOf }),
          ...(token.aliasChain !== undefined && { aliasChain: token.aliasChain }),
        };
        count++;
      }
      return jsonResult({ theme: themeName, tuple: active, count, tokens: resolved });
    },
  );

  server.registerTool(
    'get_consumer_output',
    {
      description:
        'CSS var reference + resolved value + HTML data-attribute activation for a token under an optional axis tuple. Tells an agent everything it needs to write a stylesheet or JSX snippet that pins a particular theme combination — `selector` is the compound CSS selector that matches the tuple on `<html>`, `attrs` is the same information as HTML attributes, `cssVar` is the `var(--…)` reference. Tuple defaults to the project default when omitted.',
      inputSchema: {
        path: z.string().describe('Dot-path of the token, e.g. `color.accent.bg`.'),
        tuple: z
          .record(z.string(), z.string())
          .optional()
          .describe(
            'Optional axis tuple (e.g. `{ mode: "Dark", brand: "Brand A" }`). Defaults to each axis\'s own default.',
          ),
      },
    },
    ({ path, tuple }) => {
      const prefix = project.config.cssVarPrefix ?? '';
      const activeTuple: Record<string, string> = {};
      for (const axis of project.axes) {
        const candidate = tuple?.[axis.name];
        activeTuple[axis.name] =
          candidate && axis.contexts.includes(candidate) ? candidate : axis.default;
      }
      const themeName = tupleToName(project.axes, activeTuple);
      const token = project.resolveAt(activeTuple)[path];
      if (!token) return textResult(`Token not found: ${path}`);

      const cssVar = `var(--${prefix ? `${prefix}-` : ''}${path.replaceAll('.', '-')})`;
      const attrName = (axis: string): string =>
        prefix ? `data-${prefix}-${axis}` : `data-${axis}`;
      const attrs: Record<string, string> = {};
      const selectorParts: string[] = [];
      for (const axis of project.axes) {
        const value = activeTuple[axis.name];
        if (value !== undefined) {
          attrs[attrName(axis.name)] = value;
          selectorParts.push(`[${attrName(axis.name)}="${value}"]`);
        }
      }

      return jsonResult({
        path,
        cssVar,
        value: stringifyValue(token.$value),
        type: token.$type,
        theme: themeName,
        tuple: activeTuple,
        attrs,
        selector: selectorParts.join('') || ':root',
        usageSnippet: `color: ${cssVar};`,
      });
    },
  );

  server.registerTool(
    'get_diagnostics',
    {
      description:
        'List parser / resolver / validation diagnostics for the project. Each entry carries a severity (`error`, `warn`, `info`), group, message, and optional filename / line / column for locating the issue.',
      inputSchema: {
        severity: z
          .enum(['error', 'warn', 'info'])
          .optional()
          .describe('Optional severity filter. Omit for all diagnostics.'),
      },
    },
    ({ severity }) => {
      const rows = severity
        ? project.diagnostics.filter((d) => d.severity === severity)
        : project.diagnostics;
      return jsonResult({ count: rows.length, diagnostics: rows });
    },
  );

  return server;
}

/**
 * Build a `Map<themeName, axisTuple>` covering the same set the
 * resolver loader's singleton enumeration produces: default tuple +
 * one per non-default cell on each axis + each preset. Bounded by
 * `1 + Σ(axes × (contexts - 1)) + presets.length` — linear in axis
 * cardinality, independent of the cartesian product.
 */
function buildTupleByName(project: Project): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>();
  const defaultName = tupleToName(project.axes, project.defaultTuple);
  out.set(defaultName, { ...project.defaultTuple });
  for (const axis of project.axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const tuple = { ...project.defaultTuple, [axis.name]: ctx };
      out.set(tupleToName(project.axes, tuple), tuple);
    }
  }
  for (const preset of project.presets) {
    const tuple: Record<string, string> = { ...project.defaultTuple };
    for (const [axis, ctx] of Object.entries(preset.axes)) {
      if (ctx !== undefined) tuple[axis] = ctx;
    }
    out.set(tupleToName(project.axes, tuple), tuple);
  }
  return out;
}

/**
 * Same form `permutationID` produces server-side — axis values joined
 * by ` · ` in axis order. Inlined here so MCP doesn't depend on the
 * `permutationID` export staying in core's public API through the
 * cartesian-drop chain.
 */
function tupleToName(
  axes: readonly { name: string; default: string }[],
  tuple: Readonly<Record<string, string>>,
): string {
  return axes.map((a) => tuple[a.name] ?? a.default).join(' · ');
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function textResult(text: string): { content: { type: 'text'; text: string }[] } {
  return { content: [{ type: 'text', text }] };
}

function jsonResult(data: unknown): { content: { type: 'text'; text: string }[] } {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
