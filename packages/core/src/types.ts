import type { InputSourceWithDocument } from '@terrazzo/json-schema-tools';
import type { Plugin, Resolver, TokenNormalized } from '@terrazzo/parser';
import type { CSSPluginOptions } from '@terrazzo/plugin-css';
import type { TokenListingPluginOptions } from '@terrazzo/plugin-token-listing';
import type { TokenListingByPath } from '#/token-listing.ts';

export type TokenMap = Record<string, TokenNormalized>;

/**
 * How a token's resolved value depends on the project's axes.
 *
 * - `constant` — same value across every tuple (or token missing entirely).
 * - `single` — varies with exactly one axis.
 * - `multi` — varies across two or more axes.
 *
 * Produced by `buildVarianceByPath` at load time and stored on
 * `Project.varianceByPath` for O(1) lookup; the smart CSS emitter,
 * the MCP `get_axis_variance` tool, and the `AxisVariance` doc block
 * all read this rather than re-running the analysis per call.
 */
export type VarianceKind = 'constant' | 'single' | 'multi';

/**
 * Per-axis breakdown carried on every variance result — whether each
 * axis affects this token, and the stringified value seen in each of
 * its contexts (holding other axes at their defaults).
 */
export type AxisVariancePerAxis = Record<
  string,
  {
    varying: boolean;
    contexts: Record<string, string>;
  }
>;

/**
 * Discriminated on `kind` so a `switch (result.kind)` narrows
 * `varyingAxes`'s cardinality and exposes the `axis: string` shortcut
 * on the single-axis variant. The wire shape is unchanged (the same
 * JSON the flat interface serialized to), so MCP consumers and
 * snapshot wire payloads keep working without translation.
 */
export type AxisVarianceResult =
  | {
      path: string;
      kind: 'constant';
      varyingAxes: readonly [];
      constantAcrossAxes: readonly string[];
      perAxis: AxisVariancePerAxis;
    }
  | {
      path: string;
      kind: 'single';
      /** Convenience accessor — the sole varying axis, also at `varyingAxes[0]`. */
      axis: string;
      varyingAxes: readonly [string];
      constantAcrossAxes: readonly string[];
      perAxis: AxisVariancePerAxis;
    }
  | {
      path: string;
      kind: 'multi';
      varyingAxes: readonly [string, string, ...string[]];
      constantAcrossAxes: readonly string[];
      perAxis: AxisVariancePerAxis;
    };

/**
 * Per-axis cell maps. `cells[axisName][contextName]` is the resolved
 * `TokenMap` for `{ ...defaults, [axisName]: contextName }` — the
 * single-attribute slice of the resolver's modifier space. Size is
 * bounded by `Σ(axes × contexts)`, independent of the cartesian
 * product. Forms the primary input to `composeAt` / `resolveAt`.
 */
export type Cells = Record<string, Record<string, TokenMap>>;

/**
 * One divergent partial tuple identified by `analyzeProjectVariance`.
 * A combination of axis selections at which the resolver's resolved
 * value diverges from cascade composition over `cells` — kept around
 * so `composeAt` can patch the divergence back in.
 */
export interface JointOverride {
  /** axisName → contextName for the divergent combination (at any arity ≥ 2). */
  axes: Record<string, string>;
  /** Only the tokens whose resolved value at this tuple diverges from cascade composition. */
  tokens: TokenMap;
}

/**
 * All joint-variant overrides for a project — an array of
 * `[canonicalKey, override]` pairs (canonical stringification of
 * `override.axes`). Iteration order is ascending arity so higher-order
 * divergences win over lower-order ones when applied in sequence.
 *
 * Shape mirrors the wire format the addon's virtual module ships to the
 * preview — no Map↔array marshaling at the boundary. No consumer needs
 * keyed lookup; all reads are `for (const [, override] of ...)`
 * iteration. Internal dedupe during construction (`probeJointOverrides`)
 * uses a temporary Map keyed on canonical tuple, materialized to this
 * array shape on return.
 */
export type JointOverrides = ReadonlyArray<readonly [string, JointOverride]>;

/**
 * Compute the resolved `TokenMap` for any tuple of axis selections
 * without touching the resolver. Pure function over `cells +
 * jointOverrides + axes + defaultTuple`; accepts partial tuples
 * (missing axes fall back to their defaults).
 */
export type ResolveAt = (tuple: Record<string, string>) => TokenMap;

/**
 * @internal Loader-internal materialization of a singleton tuple
 * (default tuple + per-axis non-default cells + presets). No longer
 * surfaced on `Project`; kept here as the shape `normalize` /
 * `loadResolverPermutations` / `loadLayeredPermutations` produce
 * internally, consumed by the cells builder via a resolver callback.
 */
export interface Permutation {
  name: string;
  /** The resolver input tuple (e.g. `{ theme: 'Light' }` or `{ mode: 'Dark', brand: 'Brand A' }`). */
  input: Record<string, string>;
  /** Source files this tuple was parsed from (layered loader populates; resolver mode leaves empty). */
  sources: readonly string[];
}

/**
 * One modifier axis of the theming model. Resolver-backed projects surface
 * one `Axis` per DTCG modifier; layered-config projects surface one `Axis`
 * per `axes[]` entry; projects without a resolver or layered config get a
 * single synthetic axis named `theme`.
 */
export interface Axis {
  name: string;
  contexts: readonly string[];
  default: string;
  description?: string;
  source: 'resolver' | 'layered' | 'synthetic';
}

/**
 * A named quick-select combination of axis contexts. Rendered as a pill in
 * the toolbar. Any axis the preset omits falls back to that axis's
 * `default` when applied.
 */
export interface Preset {
  name: string;
  /** axisName → contextName. Unknown keys or invalid values produce diagnostics and are sanitized. */
  axes: Partial<Record<string, string>>;
  description?: string;
}

/**
 * One authored axis for layered configurations. Each context names an
 * ordered list of glob patterns / file paths (relative to cwd) that layer
 * on top of `Config.tokens` for that context. An empty array means "no
 * override" — valid, and common for a `Default` context.
 */
export interface AxisConfig {
  name: string;
  description?: string;
  contexts: Record<string, string[]>;
  default: string;
}

/**
 * Fields shared across every swatchbook config variant. The three
 * discriminated subtypes (`ResolverConfig`, `LayeredConfig`,
 * `PlainConfig`) extend this with their own load-strategy fields plus
 * `?: never` rejections of the other variants' fields, so an invalid
 * combination (`resolver` + `axes`, `axes` without `tokens`) is a
 * compile error before it ever reaches the loader's runtime checks.
 */
interface CommonConfig {
  /**
   * Initial active tuple (`{ axisName: contextName }`). Any axis the tuple
   * omits falls back to that axis's own `default`. Unknown axis keys or
   * invalid context values produce `warn` diagnostics and are sanitized.
   * When absent, the starting tuple is built from each axis's `default`.
   */
  default?: Partial<Record<string, string>>;
  /** Prefix for emitted CSS custom properties. */
  cssVarPrefix?: string;
  /** Project-local output directory for codegen artifacts. */
  outDir?: string;
  /** Named tuple presets — rendered as quick-select pills in the toolbar. */
  presets?: Preset[];
  /**
   * Axis names to suppress from the toolbar and CSS emission. Each listed
   * axis is pinned to its `default` context: it disappears from
   * `Project.axes`, its tuples collapse into the default-context slice, and
   * emitted CSS drops it from the compound selector. Unknown names produce
   * `warn` diagnostics (group `swatchbook/disabled-axes`) and are ignored.
   * Config-level only — no runtime toggle.
   */
  disabledAxes?: string[];
  /**
   * Map from swatchbook block chrome roles (the closed set in `CHROME_PATHS`
   * — e.g. `color.surface.default`, `color.text.default`) to token paths in
   * the consumer's project. Each entry emits a `:root` alias
   * `--swatchbook-<role>: var(--<prefix>-<target>)`; blocks read the fixed
   * `--swatchbook-*` namespace directly, so the project's `cssVarPrefix`
   * never collides with chrome reads.
   *
   * Target var indirection means per-theme values flip automatically — no
   * per-theme override needed. Unknown role keys and target paths that
   * don't resolve in any theme produce `warn` diagnostics (group
   * `swatchbook/chrome`) and are dropped. Without a chrome map, blocks
   * fall back to the `Canvas` / `CanvasText` system colors.
   */
  chrome?: Record<string, string>;
  /**
   * Options forwarded to the `@terrazzo/plugin-css` instance swatchbook
   * runs internally (for the stylesheet it emits and for the Token
   * Listing's `names.css` derivation). Line this up with the consumer's
   * own `plugin-css` options — `legacyHex`, `transform`, `include`,
   * and similar — so docs-side names and values match what the
   * consumer's production build emits.
   *
   * `variableName` / `permutations` / `filename` / `skipBuild` are
   * managed internally and cannot be overridden — swatchbook's
   * axis-aware emission and in-memory listing capture depend on them.
   * Passing deprecated knobs (`baseSelector`, `baseScheme`,
   * `modeSelectors`) produces a `swatchbook/css-options` warn diagnostic
   * because they're superseded by permutations in newer plugin-css.
   */
  cssOptions?: Omit<CSSPluginOptions, 'variableName' | 'permutations' | 'filename' | 'skipBuild'>;
  /**
   * Options forwarded to `@terrazzo/plugin-token-listing`. Use
   * `platforms` to register additional platforms beyond `css` (e.g.
   * `swift`, `android`, `figma`) — each entry's `name` is a reference
   * to a loaded plugin. For the reference to resolve, that plugin has
   * to be loaded into the build, which is what `terrazzoPlugins` below
   * is for.
   *
   * `filename` is managed internally (the listing is captured in
   * memory, not written to disk).
   */
  listingOptions?: Omit<TokenListingPluginOptions, 'filename'>;
  /**
   * Additional Terrazzo plugins to load alongside swatchbook's own
   * `plugin-css` + `plugin-token-listing`. The listing can reference
   * any of these by name in its `platforms` map to derive per-platform
   * identifiers. Plugins whose outputs swatchbook doesn't consume are
   * simply ignored — they run, their files land in the in-memory
   * output set, nothing else happens.
   */
  terrazzoPlugins?: readonly Plugin[];
}

/**
 * Resolver-driven config — axes derived from a DTCG 2025.10 resolver
 * file's modifiers. `tokens` is optional: the resolver's own `$ref`
 * targets determine which files get loaded, and the addon's Vite
 * plugin derives HMR watch paths from the resolved source list.
 * Supplying `tokens` alongside `resolver` overrides the watch-path
 * derivation — useful when you want HMR to watch directories broader
 * than the resolver references directly.
 */
export interface ResolverConfig extends CommonConfig {
  resolver: string;
  tokens?: string[];
  /** Mutually exclusive with `resolver`. */
  axes?: never;
}

/**
 * Layered-axes config — authored axes with per-context overlay globs
 * that layer onto the base `tokens`. The base `tokens` is required:
 * the layered loader needs a base layer to overlay against.
 */
export interface LayeredConfig extends CommonConfig {
  axes: AxisConfig[];
  tokens: string[];
  /** Mutually exclusive with `axes`. */
  resolver?: never;
}

/**
 * Plain-parse config — single synthetic axis (`theme`), no resolver,
 * no overlays. Just parses the `tokens` globs and exposes a one-cell
 * project. The fallback for the simplest "I just have token files"
 * case.
 */
export interface PlainConfig extends CommonConfig {
  tokens: string[];
  resolver?: never;
  axes?: never;
}

/**
 * Swatchbook configuration. Discriminated by which load-strategy
 * field is present: `resolver` (resolver-driven), `axes` (layered),
 * or neither (plain-parse). Invalid combinations (`resolver` + `axes`,
 * `axes` without `tokens`) are compile-time errors; the loader still
 * checks at runtime as defense-in-depth for JS callers that bypass
 * the type system.
 */
export type Config = ResolverConfig | LayeredConfig | PlainConfig;

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
 * Loaded swatchbook project. Token data lives on `cells` (per-axis
 * resolved `TokenMap`s, bounded by `Σ(axes × contexts)`) and
 * `jointOverrides` (the partial-tuple divergences cells composition
 * cannot reproduce). Read any tuple via `project.resolveAt(tuple)`;
 * read the default-tuple snapshot via `project.defaultTokens`.
 */
export interface Project {
  config: Config;
  axes: Axis[];
  /**
   * Axis names suppressed via `config.disabledAxes`. Validated against the
   * resolver's axis list at load time — unknown names are dropped here and
   * surface as `warn` diagnostics. Downstream tooling (panels, blocks) can
   * read this to indicate that a modifier exists in the resolver but is
   * pinned to its default for this session.
   */
  disabledAxes: readonly string[];
  /** Validated + sanitized presets from `config.presets`. Empty if unset. */
  presets: readonly Preset[];
  /**
   * Validated chrome-alias map from `config.chrome`. Keys are swatchbook
   * block chrome paths; values are token paths that resolve in at least
   * one permutation. Invalid entries from the raw config are dropped and
   * reported as diagnostics. Empty if the config doesn't supply any.
   */
  chrome: Record<string, string>;
  /** Resolved tokens at the project's default tuple. Convenience for global views. */
  defaultTokens: TokenMap;
  /**
   * Per-axis resolved `TokenMap`s — `cells[axisName][contextName]` is
   * the resolved tokens for `{ ...defaultTuple, [axisName]: contextName }`.
   * Bounded by `Σ(axes × contexts)`, independent of the cartesian
   * product. The primary input to {@link resolveAt}.
   */
  cells: Cells;
  /**
   * Joint-variant partial-tuple overrides — token values that diverge
   * from cascade composition over `cells` and need to be patched in
   * by {@link resolveAt}. Probed via `analyzeProjectVariance` at all
   * arities ≥ 2 against the cartesian truth.
   */
  jointOverrides: JointOverrides;
  /**
   * The default tuple — `{ axisName: axis.default }` for every axis,
   * after `disabledAxes` filtering. The baseline that `cells` /
   * `resolveAt` compose against.
   */
  defaultTuple: Record<string, string>;
  /**
   * Compose the resolved `TokenMap` for any tuple of axis selections.
   * Pure function over `cells + jointOverrides + axes + defaultTuple`,
   * memoized on the tuple key. Partial tuples are allowed — missing
   * axes fall back to their defaults.
   */
  resolveAt: ResolveAt;
  /**
   * Per-token cached `AxisVarianceResult` — pre-computed at load time
   * so consumers (block axis-variance display, MCP `get_axis_variance`,
   * smart-emitter Phase 2) can O(1) look up which axes affect a token
   * instead of re-running the bucket analysis on every read. The map
   * spans every path that appears in any permutation's resolved map.
   */
  varianceByPath: ReadonlyMap<string, AxisVarianceResult>;
  /**
   * Absolute paths of every file loaded while building the project —
   * the resolver file (if any), every `$ref` target it pulled in, every
   * overlay file the layered loader concatenated, or every globbed file
   * the plain-parse fallback consumed. Consumers use this for file-watching
   * (the addon's Vite plugin does exactly that).
   */
  sourceFiles: string[];
  /**
   * Absolute path of the directory all config-relative paths (resolver,
   * token globs, layered overlays) resolved against. Passed into
   * `loadProject(config, cwd)`; retained here because downstream emitters
   * need it for `defineConfig({ cwd })` in Terrazzo's JS API.
   */
  cwd: string;
  /**
   * Path-indexed Token Listing data from `@terrazzo/plugin-token-listing`.
   * Each entry carries the plugin-css-authoritative var name under
   * `$extensions["app.terrazzo.listing"].names.css`, a `previewValue`
   * string, the original aliased value, and the source file + line range.
   * Empty when the project isn't resolver-backed (layered / plain-parse
   * paths don't run the build), or when the listing plugin errored.
   *
   * Treat as enrichment: consumers should fall back gracefully when a
   * given path is absent.
   */
  listing: TokenListingByPath;
  diagnostics: Diagnostic[];
}

/**
 * Pass-through bag of the three values `@terrazzo/parser`'s `build()`
 * requires alongside a config. Threaded through `loadResolver()` →
 * `loadProject()` → `computeTokenListing()` during the load and then
 * dropped — never lands on the public `Project` shape, never crosses
 * a package boundary.
 *
 * @internal Internal to the loader pipeline. The `ParserInput` shape
 * leaks Terrazzo types (`Resolver`, `InputSourceWithDocument`) that
 * would otherwise pin our public API to a peer dep's evolving surface;
 * keeping it private lets the swatchbook surface stay stable.
 */
export interface ParserInput {
  tokens: Record<string, TokenNormalized>;
  sources: InputSourceWithDocument[];
  resolver: Resolver;
}

/**
 * @internal Serialize an axis tuple to the stable string ID used as
 * an internal cache key and the wire-format theme name. Single-axis
 * tuples stringify to the context value alone (`{ theme: 'Light' }` →
 * `"Light"`); multi-axis tuples join context values with ` · ` in
 * insertion order (`{ mode: 'Dark', brand: 'Brand A' }` → `"Dark · Brand A"`).
 */
export function permutationID(input: Record<string, string>): string {
  const values = Object.values(input);
  const [first, ...rest] = values;
  if (first === undefined) return '';
  if (rest.length === 0) return first;
  return values.join(' · ');
}

/**
 * Display-side integration the Storybook addon exposes for a third-party
 * tool (Tailwind v4, emotion, vanilla-extract, bootstrap, whatever).
 * Each integration contributes at most one virtual module whose body is
 * derived from the loaded `Project`. The addon's Vite plugin serves the
 * virtual module under `integration.virtualModule.virtualId` and
 * re-renders it on HMR so the output stays in lockstep with whatever
 * the toolbar / config / tokens currently say.
 *
 * Integrations are published as their own packages
 * (`@unpunnyfuns/swatchbook-integrations/tailwind`, …) and composed into
 * the addon via its options; the addon itself stays tool-agnostic.
 */
export interface SwatchbookIntegration {
  /** Stable identifier for logs + diagnostics. */
  name: string;
  /**
   * Optional virtual module this integration serves. Users import
   * `virtualId` from their preview (or main) and receive whatever
   * `render(project)` produces for the current project state.
   */
  virtualModule?: {
    /** e.g. `'virtual:swatchbook/tailwind.css'`. Must be unique. */
    virtualId: string;
    /** Produce the module body for the currently-loaded project. */
    render(project: Project): string;
    /**
     * When `true`, the addon's preset auto-injects a side-effect import
     * (`import '<virtualId>';`) into the Storybook preview. Appropriate
     * for integrations that contribute global CSS (Tailwind's `@theme`
     * block, a stylesheet full of rules). Integrations exposing named
     * exports that consumers import per-site (e.g. `import { theme }
     * from '...'`) should leave this `false`. Defaults to `false`.
     */
    autoInject?: boolean;
  };
}
