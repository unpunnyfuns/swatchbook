import type { TokenNormalized } from '@terrazzo/parser';

export type TokenMap = Record<string, TokenNormalized>;

/** A single theme composition resolved from the DTCG 2025.10 resolver. */
export interface Theme {
  name: string;
  /** The resolver input permutation (e.g. `{ theme: 'Light' }` or `{ appearance: 'light', brand: 'a' }`). */
  input: Record<string, string>;
  /** Reserved for future use. Empty for resolver mode. */
  sources: string[];
}

/**
 * One modifier axis of the theming model. Resolver-backed projects surface
 * one `Axis` per DTCG modifier; projects without a resolver (e.g. plain
 * token parsing with no composition) get a single synthetic axis named
 * `theme`.
 */
export interface Axis {
  name: string;
  contexts: string[];
  default: string;
  description?: string;
  source: 'resolver' | 'synthetic';
}

/** Swatchbook configuration. The resolver is the sole theming input. */
export interface Config {
  /** Glob patterns for DTCG token files. */
  tokens: string[];
  /** Path to a DTCG 2025.10 resolver file. */
  resolver: string;
  /** Name of the default theme. */
  default?: string;
  /** Prefix for emitted CSS custom properties. */
  cssVarPrefix?: string;
  /** Project-local output directory for codegen artifacts. */
  outDir?: string;
}

export type DiagnosticSeverity = 'error' | 'warn' | 'info';

export interface Diagnostic {
  severity: DiagnosticSeverity;
  /** Source group from Terrazzo (parser, resolver, plugin, …). */
  group: string;
  message: string;
  filename?: string;
  line?: number;
  column?: number;
}

/**
 * Loaded swatchbook project. Themes are eagerly resolved at load time; use
 * `resolveTheme(project, name)` to fetch one.
 */
export interface Project {
  config: Config;
  axes: Axis[];
  themes: Theme[];
  /** Eagerly-resolved tokens per theme, keyed by `theme.name`. */
  themesResolved: Record<string, TokenMap>;
  /** Default theme's resolved tokens — convenience for global views. */
  graph: TokenMap;
  diagnostics: Diagnostic[];
}

/**
 * Serialize an axis tuple to the stable string ID used as a `Theme.name`,
 * CSS data-attribute value, and cache key. Single-axis tuples stringify to
 * the context value alone (`{ theme: 'Light' }` → `"Light"`); multi-axis
 * tuples join context values with ` · ` in insertion order
 * (`{ mode: 'Dark', brand: 'Brand A' }` → `"Dark · Brand A"`).
 */
export function permutationID(input: Record<string, string>): string {
  const values = Object.values(input);
  if (values.length === 0) return '';
  if (values.length === 1) return values[0] as string;
  return values.join(' · ');
}

export interface ResolvedTheme {
  name: string;
  tokens: TokenMap;
}
