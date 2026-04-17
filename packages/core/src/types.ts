import type { TokenNormalized } from '@terrazzo/parser';

export type TokenMap = Record<string, TokenNormalized>;

/** A single theme composition. */
export interface Theme {
  name: string;
  /**
   * For DTCG-resolver mode: the resolver input (e.g. `{ appearance: 'light', brand: 'a' }`).
   * For layered / manifest modes: mirrors `{ theme: name }` for a uniform shape.
   */
  input: Record<string, string>;
  /** Ordered layer file paths used to build this theme. Empty for resolver mode. */
  sources: string[];
}

/**
 * Swatchbook configuration. Accepts exactly one of `themes`, `resolver`, or
 * `manifest` — mixing is an error surfaced during `loadProject`.
 */
export interface Config {
  /** Glob patterns for DTCG token files. */
  tokens: string[];
  /** Explicit layered compositions. */
  themes?: ThemeConfig[];
  /** Path to a DTCG 2025.10 resolver file. */
  resolver?: string;
  /** Path to a Tokens Studio `$themes` manifest. */
  manifest?: string;
  /** Name of the default theme. */
  default?: string;
  /** Prefix for emitted CSS custom properties. */
  cssVarPrefix?: string;
  /** Project-local output directory for codegen artifacts. */
  outDir?: string;
}

export interface ThemeConfig {
  name: string;
  layers: string[];
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
