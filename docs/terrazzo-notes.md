# Terrazzo capability audit

Spike completed during M0 against `@terrazzo/parser@2.0.3`. This note records what Terrazzo gives us for free and what swatchbook-core still has to build.

## TL;DR

Terrazzo covers more than the plan originally assumed. Core shrinks from "implement DTCG resolvers ourselves" to "shape swatchbook's three config inputs into Terrazzo's resolver model and call `parse` / `resolver.apply`". CSS emission, typed codegen, and the diagnostic surface remain our responsibility.

## Version

- `@terrazzo/parser` — `2.0.3` (April 2026)
- DTCG spec version targeted — `2025.10` (enforced in `ResolverSource.version`)
- ESM-only (`"type": "module"`, `exports: { ".": "./dist/index.js" }`)

## Exports we'll actually use

From `@terrazzo/parser`'s `index.d.ts`:

- `parse(input | input[], options) → Promise<ParseResult>`
  - `ParseResult = { tokens: TokenNormalizedSet, sources: InputSourceWithDocument[], resolver: Resolver }`
  - Accepts multiple `InputSource`s in a single call → covers multi-file loading.
  - `options.resolveAliases` controls whether `{alias}` chains are pre-resolved.
  - `options.continueOnError: true` → non-fatal errors surface via `logger` instead of throwing.
- `loadResolver(inputs, { config, logger, req })` — detects a resolver doc among the inputs.
- `createResolver(resolverSourceNormalized, { config, logger, sources }) → Resolver`
  - `Resolver.apply(input, options?) → TokenNormalizedSet` — the money method. Applies one permutation.
  - `Resolver.listPermutations() → Input[]` — every valid combination. Direct feed for our theme list.
  - `Resolver.getPermutationID(input) → string` — stable key for an input; we use as the Theme name fallback.
- `isLikelyResolver(doc) → boolean` — heuristic to tell a resolver doc from a token doc.
- `normalizeResolver(doc, opts)` and `validateResolver(doc, opts)` — we reuse these to validate synthetic resolvers we generate from layered configs / Tokens Studio manifests.
- `Logger` + `LogEntry` — their diagnostic primitive. Our `Diagnostic` type wraps this 1:1.
- `defineConfig(rawConfig, opts)` — **Terrazzo's, not ours**. Naming collision → swatchbook-core exports `defineSwatchbookConfig` to avoid ambiguity when both are imported.
- `mergeConfigs(a, b)` — useful when we need to combine a user config with our defaults.

## Token shape

`TokenNormalized` is what we hand to `emitCss` / `emitTypes`. It's already:
- Type-tagged (`$type`, `$value`, `$description`, `$extensions`).
- Mode-aware (`modes: ModeMap<…>`) — theming shows up here.
- Primitive + composite types covered (color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, strokeStyle, border, transition, shadow, gradient, typography).
- Composites have a sibling `TokenNormalizedSet` with sub-value normalization done.

We never hand-parse DTCG JSON. We always go through `parse`.

## What swatchbook-core owns

The scope shrank but didn't disappear:

1. **Config shape** — `defineSwatchbookConfig({ tokens, themes | resolver | manifest, default, cssVarPrefix, outDir })`. Validates that exactly one theming mode is set.
2. **Three-way theming normalization** (`themes/normalize.ts`):
   - **Explicit layers** → synthesize a `ResolverSource` with one set per layer and one inline permutation per theme; hand to `createResolver`.
   - **DTCG resolver** → read the file, feed straight to `loadResolver` / `createResolver`.
   - **Tokens Studio manifest** → read `$themes[]`, translate each composition into resolver sets (file groups) + modifiers (axes); hand to `createResolver`.
   All three paths produce a single `Resolver` whose `listPermutations()` drives our `Theme[]`.
3. **CSS emission** (`css.ts`) — we still own this because Terrazzo's CSS plugin lives in `@terrazzo/plugin-css` and expects a Terrazzo build pipeline that we aren't running (we want one concatenated stylesheet keyed by `[data-theme="…"]` — not multiple output files). Emission walks `TokenNormalizedSet` directly.
4. **Types codegen** (`emit.ts::emitTypes`) — produce the token-path union + values object from the same walk. Not something Terrazzo provides.
5. **Diagnostics wrapper** (`diagnostics.ts`) — adapt Terrazzo's `LogEntry` (group/severity/filename/node/src) into our public `Diagnostic` type. Collect them via a custom `Logger` subclass that buffers instead of writing to stdout.

## Plan deltas captured

The following go to `decisions.md` once it exists (M0 governance step):

- Core renamed its public helper `defineSwatchbookConfig` (not `defineConfig`) to avoid collision with Terrazzo's export.
- Layered themes and Tokens Studio manifests are **compiled into synthetic DTCG resolvers** internally. Single code path downstream.
- Three-way equivalence test in M1 becomes: all three inputs produce the same `Resolver.listPermutations()` and the same `resolver.apply(input)` → same `TokenNormalizedSet` → byte-identical CSS.
- Core is lighter than originally spec'd — no custom alias resolver, no custom DTCG resolver engine. Scope estimate for M1 revises down ~1 day.

## Not investigated (deferred)

- `@terrazzo/plugin-css` behavior — we don't depend on it, but it's worth reading for CSS var naming conventions before M1 Work starts.
- Performance of `parse` on large token sets — not a concern at this scale.
- YAML input (`yamlToMomoa`) — v1 only handles JSON; YAML support can come later at zero cost if users want it.
