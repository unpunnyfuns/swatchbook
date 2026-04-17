import type { Resolver, TokenNormalized } from '@terrazzo/parser';

/**
 * A single theme composition — the permutation input that hits Terrazzo's
 * `resolver.apply()` to realize its tokens.
 */
export interface Theme {
  name: string;
  /** Resolver input (e.g. `{ appearance: 'light', brand: 'a' }`). */
  input: Record<string, string>;
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
 * Loaded swatchbook project — the shape every downstream consumer (addon
 * preset, block renderer, CSS emitter) works against.
 */
export interface Project {
  config: Config;
  /** Themes normalized from whichever theming input the config used. */
  themes: Theme[];
  /** Terrazzo resolver. Use `resolver.apply(theme.input)` to realize tokens. */
  resolver: Resolver;
  /** Base (pre-resolution) token set. */
  graph: Record<string, TokenNormalized>;
  diagnostics: Diagnostic[];
}

export interface ResolvedTheme {
  name: string;
  tokens: Record<string, TokenNormalized>;
}
