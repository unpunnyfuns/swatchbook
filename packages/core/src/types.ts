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
  themes: Theme[];
  /** Eagerly-resolved tokens per theme, keyed by `theme.name`. */
  themesResolved: Record<string, TokenMap>;
  /** Default theme's resolved tokens — convenience for global views. */
  graph: TokenMap;
  diagnostics: Diagnostic[];
}

export interface ResolvedTheme {
  name: string;
  tokens: TokenMap;
}
