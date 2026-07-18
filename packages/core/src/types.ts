import type { InputSourceWithDocument } from '@terrazzo/json-schema-tools';
import type { Plugin, Resolver, TokenNormalized } from '@terrazzo/parser';
import type { CSSPluginOptions } from '@terrazzo/plugin-css';
import type { TokenListingPluginOptions } from '@terrazzo/plugin-token-listing';
import type { ChromeRole } from '#/chrome.ts';
import type { ColorFormat } from '#/color-formats.ts';
import type { TokenListingByPath } from '#/token-listing.ts';
import type { TokenGraph } from '#/token-graph/types.ts';

/**
 * Swatchbook's public token shape — the contract surfaced on
 * `Project.defaultTokens` and `Project.resolveAt()` output. A strict
 * subset of `@terrazzo/parser`'s `TokenNormalized`: the fields
 * downstream blocks actually read, no internals (`id`, `source`,
 * `originalValue`, `group`, `dependencies`, `$extensions`, `$extends`)
 * leaked through.
 *
 * Insulates swatchbook consumers from Terrazzo type churn: a future
 * `TokenNormalized` field rename or restructure won't ripple into the
 * `@unpunnyfuns/swatchbook-core` API surface. Assignable from
 * `TokenNormalized` by structural subtyping — internal core code can
 * pass resolver output straight into a `TokenMap` without casts.
 */
export interface SwatchbookToken {
  $type?: string | undefined;
  $value?: unknown;
  $description?: string | undefined;
  /**
   * DTCG `$deprecated`, already group-inheritance-normalized per token by
   * the parser. `true` (deprecated, no message) or a string (deprecated,
   * with a message that typically points at the replacement). Surfaced as
   * a row indicator + strikethrough in TokenNavigator and a notice in
   * TokenDetail.
   */
  $deprecated?: string | boolean | undefined;
  aliasOf?: string | undefined;
  aliasChain?: readonly string[] | undefined;
  aliasedBy?: readonly string[] | undefined;
  /**
   * Per-sub-field alias map for composite tokens whose value blends
   * primitives with aliased fragments. Shape varies per composite type;
   * typed as `unknown` so consumers narrow at the use-site.
   */
  partialAliasOf?: unknown;
}

export type TokenMap = Record<string, SwatchbookToken>;

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
 * on the single-axis variant.
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
 * Compose the resolved `TokenMap` for any tuple of axis selections.
 * Graph-backed: walks `Project.tokenGraph` rather than re-running the
 * resolver. Accepts partial tuples (missing axes fall back to their
 * defaults) and memoizes on the canonical tuple key.
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
  input: Readonly<Record<string, string>>;
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

// Fields shared across every swatchbook config variant. The three
// discriminated subtypes (`ResolverConfig`, `LayeredConfig`,
// `PlainConfig`) extend this with their own load-strategy fields plus
// `?: never` rejections of the other variants' fields, so an invalid
// combination (`resolver` + `axes`, `axes` without `tokens`) is a
// compile error before it ever reaches the loader's runtime checks.
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
  chrome?: Partial<Record<ChromeRole, string>>;
  /**
   * Project-wide baseline for the block row-indicator strip (the
   * `<TokenNavigator>` / `<TokenTable>` per-row alias / variance / gamut /
   * deprecation / description glyphs). Known keys are `alias`, `variance`,
   * `gamut`, `deprecation`, `description`, `composes`; each maps to a
   * boolean. Sits between the hard-coded indicator defaults and a block's
   * own `indicators` prop — a per-block prop overrides this baseline.
   *
   * Typed loosely as `Record<string, boolean>` so core stays free of a
   * blocks dependency; blocks narrows the keys at the use-site.
   */
  indicators?: Readonly<Record<string, boolean>>;
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
  /**
   * Maximum arity of joint-divergence detection per token. Joint
   * divergences are cases where the cartesian-correct value at a
   * multi-axis tuple differs from cascade composition of all lower-arity
   * blocks. Each such case emits a compound CSS selector
   * (`[data-axis-a="…"][data-axis-b="…"]…`) at emission time.
   *
   * Default `4`. Covers the largest joint shapes real-world design
   * systems tend to express (mode × brand × density × contrast).
   *
   * Bump if the design system has tokens with genuine 5+-axis joint
   * divergences — those tuples will otherwise resolve to the
   * cascade-composed value, which may be the wrong CSS variable
   * binding for the specific multi-axis combination.
   *
   * Lower if load-time work is a concern in projects with many
   * axes. Per-token probe work scales as
   * `Σ_{k=2..arity} C(|affectedBy|, k) × Π non-default contexts in combo`;
   * tokens affected by many axes including dense (large-context-count)
   * ones dominate. `1` disables joint-block emission entirely.
   *
   * @default 4
   */
  maxJointArity?: number;
  /**
   * Starting color format for blocks that display color values; a
   * per-block prop overrides it. Defaults to `'hex'`.
   */
  defaultColorFormat?: ColorFormat;
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

/**
 * A single problem or notice surfaced while loading or building a project.
 * Collected on `Project.diagnostics`; consumers render these as toolbar
 * badges, console output, or CLI exit-code triggers.
 *
 * `group` is a `swatchbook/<area>` slug for swatchbook-originated
 * diagnostics (e.g. `swatchbook/chrome`, `swatchbook/disabled-axes`,
 * `swatchbook/css-options`, `swatchbook/listing`) or a bare Terrazzo group
 * name (`parser`, `resolver`, `plugin`, …) when the diagnostic is passed
 * through unchanged from the underlying `@terrazzo/parser` build. `filename`
 * and `line` are populated only when the diagnostic traces back to a
 * specific source location Terrazzo reported (a parse or resolver error);
 * swatchbook-originated diagnostics about config shape or runtime behavior
 * omit both.
 */
export interface Diagnostic {
  severity: DiagnosticSeverity;
  /** Source group from Terrazzo (parser, resolver, plugin, …). */
  group: string;
  message: string;
  filename?: string;
  line?: number;
}

/**
 * Loaded swatchbook project. Read any tuple via `project.resolveAt(tuple)`;
 * read the default-tuple snapshot directly via `project.defaultTokens`.
 * Walk the project's token resolution graph via `project.tokenGraph`.
 */
export interface Project {
  config: Config;
  axes: readonly Axis[];
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
   * Validated chrome-alias map from `config.chrome`. Keys are members
   * of the closed `ChromeRole` set; values are token paths that resolve
   * in at least one permutation. Invalid entries from the raw config
   * are dropped and reported as diagnostics. Empty when the config
   * doesn't supply any.
   */
  chrome: Partial<Record<ChromeRole, string>>;
  /** Resolved tokens at the project's default tuple. Convenience for global views. */
  defaultTokens: TokenMap;
  /**
   * The default tuple — `{ axisName: axis.default }` for every axis,
   * after `disabledAxes` filtering.
   */
  defaultTuple: Record<string, string>;
  /**
   * Compose the resolved `TokenMap` for any tuple of axis selections.
   * Graph-backed; memoized on the canonical tuple key. Partial tuples
   * are allowed — missing axes fall back to their defaults.
   */
  resolveAt: ResolveAt;
  /**
   * Walkable token graph — the primary resolution data structure.
   * Consumers can query through it via the
   * `@unpunnyfuns/swatchbook-core/graph` subpath helpers (`resolveAllAt`,
   * `getVariance`, `listPaths`, etc.).
   */
  tokenGraph: TokenGraph;
  /**
   * Absolute paths of every file loaded while building the project —
   * the resolver file (if any), every `$ref` target it pulled in, every
   * overlay file the layered loader concatenated, or every globbed file
   * the plain-parse fallback consumed. Consumers use this for file-watching
   * (the addon's Vite plugin does exactly that).
   */
  sourceFiles: readonly string[];
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
 *
 * Not interchangeable with `tupleToName` (themes.ts): this is the
 * insertion-order internal wire key with no default fallback, whereas
 * `tupleToName` builds the axis-order display name and fills omitted axes
 * from their defaults.
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
