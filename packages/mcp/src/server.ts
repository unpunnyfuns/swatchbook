import type { Project } from '@unpunnyfuns/swatchbook-core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { formatColorEveryWay } from '#/format-color.ts';
import { matchPath } from '#/match.ts';

/**
 * Build a swatchbook MCP server bound to a loaded project. Tools expose the
 * project's tokens, axes, and diagnostics so an AI agent can query them
 * without running Storybook. The server is stateless beyond the project
 * reference — all tools operate on the supplied snapshot.
 *
 * Exported as a factory so callers can reload the project on config changes
 * and rebind without restarting the MCP transport.
 */
export function createServer(project: Project): McpServer {
  const server = new McpServer(
    {
      name: '@unpunnyfuns/swatchbook-mcp',
      version: project.config.cssVarPrefix ? `project:${project.config.cssVarPrefix}` : 'project',
    },
    {
      instructions:
        'Query a swatchbook DTCG project: list tokens by path glob, inspect individual tokens (value, $type, alias chain, per-theme resolved values), read axes / presets, and inspect diagnostics.',
    },
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
          .describe('Theme name to read values from. Defaults to the project default theme.'),
      },
    },
    ({ filter, type, theme }) => {
      const themeName = theme ?? project.themes[0]?.name;
      if (!themeName) {
        return textResult('No themes in project.');
      }
      const tokens = project.themesResolved[themeName] ?? {};
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

      for (const theme of project.themes) {
        const token = project.themesResolved[theme.name]?.[path];
        if (!token) continue;
        found = true;
        type ??= token.$type;
        description ??= token.$description;
        aliasedBy ??= token.aliasedBy;
        perTheme[theme.name] = {
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
        'List the project axes — each axis has a name, its contexts (discrete values like `Light` / `Dark`), a default, and a source (`resolver` for DTCG-resolver-driven, `layered` for authored layered axes, `synthetic` for single-theme projects). Also returns the named themes (every axis tuple combination) and any presets defined in the project config.',
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
        themes: project.themes.map((t) => ({ name: t.name, input: t.input })),
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
      for (const theme of project.themes) {
        const token = project.themesResolved[theme.name]?.[path];
        if (!token) continue;
        found = true;
        const chain: string[] = [path];
        if (token.aliasChain && token.aliasChain.length > 0) chain.push(...token.aliasChain);
        else if (token.aliasOf) chain.push(token.aliasOf);
        perTheme[theme.name] = {
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
      const themeName = project.themes[0]?.name;
      if (!themeName) return textResult('No themes in project.');
      const tokens = project.themesResolved[themeName] ?? {};
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
          .describe('Theme name to read the value from. Defaults to the project default theme.'),
      },
    },
    ({ path, theme }) => {
      const themeName = theme ?? project.themes[0]?.name;
      if (!themeName) return textResult('No themes in project.');
      const token = project.themesResolved[themeName]?.[path];
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
      const themeName =
        project.themes.find((t) => {
          for (const axis of project.axes) {
            if ((t.input as Record<string, string>)[axis.name] !== activeTuple[axis.name]) {
              return false;
            }
          }
          return true;
        })?.name ??
        project.themes[0]?.name ??
        '';
      const token = themeName ? project.themesResolved[themeName]?.[path] : undefined;
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
