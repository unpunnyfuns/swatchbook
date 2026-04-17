# Swatchbook — Storybook addon for DTCG design tokens

## Context

`/Users/palnes/src/swatchbook` has been initialized: git repo, root `package.json` (currently `@unpunnyfuns/swatchbook` — to be renamed to `swatchbook-monorepo` private at scaffold; see "Workspace root"), pnpm 10.18.1, MIT, empty `pnpm-lock.yaml`. Goal: a Storybook addon + doc blocks that lets authors browse DTCG design tokens, render them in docs, switch themes from the toolbar, and replace the default color control with a token picker. Must support multi-layer DTCG theming (layered files, DTCG 2025.10 resolvers, and Tokens Studio `$themes` manifests). Terrazzo (`@terrazzo/parser`) is the expected foundation for DTCG parsing/alias resolution — its capability surface is validated in Step 0 before scope is final.

Packages published under the `@unpunnyfuns` scope.

Decisions locked in:
- Monorepo, pnpm workspaces, Turborepo
- Theming: **both** DTCG 2025.10 resolvers (native spec) **and** Tokens Studio `$themes` manifest. Core normalizes both to a single internal `Theme[]` shape.
- v1 control: color only (token picker). Control stores `var(--…)` **directly** in args — swatch/label is chrome only, no decorator substitution.
- Doc blocks: TokenTable, ColorPalette, TypographyScale, TokenDetail
- Framework: React (CSF3). Vite builder only — no Webpack path in v1.
- Runtime: CSS custom properties are the source of truth, `useToken()` hook as typed convenience
- Config: `swatchbook.config.ts` loaded by preset (primary), `parameters.swatchbook` override (per-story)
- Theme toolbar UI: rolled in-house (not built on `@storybook/addon-themes`). Rationale: our toolbar needs metadata-rich entries (composition chips for stacked themes like "Light · Brand A", per-theme counts, resolver-vs-manifest indicators) that addon-themes' string-keyed API doesn't model cleanly. We accept the duplication.

## Repo layout

Standard apps/packages monorepo, orchestrated by **Turborepo** + pnpm workspaces.

```
swatchbook/
  package.json                      # pnpm workspace root, private
  pnpm-workspace.yaml               # packages: ['apps/*', 'packages/*']
  turbo.json                        # pipeline: build, test, storybook, lint, format, typecheck
  tsconfig.base.json
  .oxlintrc.json
  .oxfmtrc.json
  packages/
    tokens-reference/               # private, exhaustive DTCG pyramid — test bed
      tokens/                       # ref/ sys/ cmp/ themes/ + $themes.manifest.json + resolver.json
      package.json                  # private: true; exports tokens/ + path helpers
      index.ts                      # export const tokensDir, manifestPath, resolverPath (via import.meta)
    tokens-starter/                 # @unpunnyfuns/swatchbook-tokens — published starter
      tokens/                       # slim ref + sys + 2 themes (light/dark); opinionated
      src/
        index.ts                    # typed values, per-theme object exports
      dist/                         # built: resolved JSON per theme + CSS per theme + .d.ts
      package.json                  # exports: './tokens/*', './css/*.css', './themes/*.json', main ts
    core/                           # @unpunnyfuns/swatchbook-core
      src/
        config.ts                   # defineConfig(), config loader
        parse.ts                    # Terrazzo wrapper, alias resolution
        themes/
          layered.ts                # explicit-layers path
          resolver.ts               # DTCG 2025.10 resolvers path
          manifest.ts               # Tokens Studio $themes path
          normalize.ts              # converges all three into Theme[]
        css.ts                      # graph → CSS custom properties text
        emit.ts                     # emitCss + emitTypes
        diagnostics.ts              # typed Diagnostic objects
        types.ts                    # Token, Project, Theme, ResolvedToken
        index.ts                    # public exports only
      test/                         # vitest unit tests + DTCG fixtures
    addon/                          # @unpunnyfuns/swatchbook-addon
      src/
        preset.ts                   # managerEntries, previewAnnotations, viteFinal
        manager.tsx                 # toolbar tool (theme switcher) + panel (browser)
        preview.ts                  # decorator: inject CSS vars, set data-theme
        hooks/useToken.ts           # typed hook, reads from preview globals
        controls/color.tsx          # argType control: token picker
        virtual/tokens.ts           # virtual module, static token JSON built at config time
      package.json                  # storybook field (displayName, icon, frameworks: [react])
    blocks/                         # @unpunnyfuns/swatchbook-blocks
      src/
        TokenTable.tsx
        ColorPalette.tsx
        TypographyScale.tsx
        TokenDetail.tsx
        index.ts
      test/                         # vitest unit tests
  apps/
    storybook/                      # first-class app: docs site + integration testbed
      .storybook/
        main.ts                     # addons: swatchbook addon + @storybook/addon-vitest + @storybook/addon-mcp
        preview.ts
        vitest.setup.ts
      src/
        components/                 # demo components consuming tokens (Button, Card, …)
        stories/                    # CSF3 stories with play fns (interaction tests)
        docs/                       # MDX pages using @unpunnyfuns/swatchbook-blocks
      swatchbook.config.ts          # points at @unpunnyfuns/swatchbook-tokens-reference
      vitest.config.ts              # Storybook Test (project: 'storybook')
      package.json                  # private, not published
```

## Package responsibilities

### `@unpunnyfuns/swatchbook-core`
Pure, framework-free. Terrazzo does the heavy lifting — **but first confirm its API surface via the Step 0 spike.** If `@terrazzo/parser` doesn't expose resolved graphs / multi-file merge / composite emission helpers, core absorbs that work (adds ~1–2 days) and the plan reflects it then.

**Public API (exported from `index.ts`):**
- `defineConfig(config): Config` — identity helper for typed `swatchbook.config.ts`.
- `loadProject(config): Project` — one-shot: resolve globs, parse DTCG via Terrazzo, normalize theming, return `Project { graph, themes, diagnostics }`.
- `resolveTheme(project, themeName): ResolvedTheme` — merges theme layers, resolves aliases, returns `ResolvedTheme { tokens: Map<path, ResolvedToken> }`.
- `emitCss(project, options?): string` — concatenated stylesheet, one `[data-theme="…"]` block per theme.
- `emitTypes(project): string` — TypeScript module source: token-path union + values object, for codegen.
- Types: `Config`, `Project`, `Token`, `ResolvedToken`, `Theme`, `Diagnostic`.

**Internal (not exported):**
- `parse.ts` — Terrazzo wrapper, alias resolution.
- `themes/layered.ts` — handle `config.themes` layer list.
- `themes/resolver.ts` — handle DTCG 2025.10 resolver definitions embedded in token files.
- `themes/manifest.ts` — handle Tokens Studio `$themes` files. Detects by presence of `$themes` array at top level.
- `themes/normalize.ts` — converges all three paths (layered, resolver, manifest) into a single internal `Theme[]`.

**Two theming standards, one internal shape:**

```ts
// Option A: explicit layers (config-driven)
defineConfig({
  tokens: ['tokens/**/*.json'],
  themes: [
    { name: 'light', layers: ['ref/**', 'sys/**', 'cmp/**', 'themes/light.json'] },
    { name: 'dark',  layers: ['ref/**', 'sys/**', 'cmp/**', 'themes/dark.json'] },
  ],
});

// Option B: DTCG 2025.10 resolver (native, spec-defined)
defineConfig({
  tokens: ['tokens/**/*.json'],
  resolver: 'tokens/resolver.json',  // or inline: { resolver: {...} }
});

// Option C: Tokens Studio manifest
defineConfig({
  tokens: ['tokens/**/*.json'],
  manifest: 'tokens/$themes.manifest.json',
});
```

All three produce identical `Theme[]` internally. Mixing is an error (must pick one). Core unit tests pin the equivalence: same logical composition across all three paths → byte-identical CSS emission.

Other config options:
```ts
defineConfig({
  default: 'light',
  cssVarPrefix: '',                  // e.g. 'ds' → --ds-color-brand-primary
  outDir: '.swatchbook',             // codegen target for emitTypes + dev artifacts
});
```

### `@unpunnyfuns/swatchbook-addon`
Storybook 10.3+ addon (React). Preset wires everything; manager/preview scripts are separate entry points as Storybook expects. Peer range pinned to the latest stable at scaffold time — MCP support requires 10.3.

- **Preset (`preset.ts`)**
  - Reads `swatchbook.config.ts` from the Storybook root at config time.
  - Calls `loadProject` + `resolveTheme` for each theme → precomputed JSON token graph + per-theme CSS.
  - Exposes the result to the preview via a **Vite virtual module** (`virtual:swatchbook/tokens`) using `resolveId`/`load` in `viteFinal`. Avoids parsing JSON in the browser and keeps the preview bundle small.
  - HMR: a `configureServer` hook in the same Vite plugin watches the token files and manifest (via `server.watcher.add`); on change, re-runs `loadProject` and calls `moduleGraph.invalidateModule(...)` for the virtual module so the preview reloads with fresh tokens.
  - Writes `emitTypes(project)` output to `<outDir>/tokens.d.ts` (default `.swatchbook/tokens.d.ts`, project-local, gitignored). Consumers add `"include": [".swatchbook/**/*.d.ts"]` to their tsconfig. **Never writes into `node_modules`.**
  - Registers `managerEntries` (toolbar/panel) and `previewAnnotations` (decorator).
  - **Vite-only** in v1. If a user runs Storybook on Webpack, the preset errors at startup with a clear message. Revisit post-v1.

- **Manager (`manager.tsx`)**
  - Toolbar `TOOL` — theme switcher dropdown reading `globals.swatchbookTheme`, calling `updateGlobals`. Entries render as `<name>` + composition chips (for stacked themes) + resolver/manifest/layered source badge.
  - `PANEL` — two tabs: **Tokens** (searchable/filterable list grouped by `$type` and path, swatches and resolved values; click → copies `var(--…)`) and **Diagnostics** (error/warn/info list from `project.diagnostics`; green "OK" badge when empty).

- **Preview (`preview.ts`)**
  - Global decorator: on `globals.swatchbookTheme` change, set `<html data-theme="…">` and ensure the theme's CSS stylesheet is present (mounted once per theme, toggled by attribute).
  - Exposes `parameters.swatchbook` override so individual stories can force a theme or inject extra tokens.

- **Color control (`controls/color.tsx`)**
  - Custom argType `swatchbook-color`: renders a searchable popover of color tokens (grouped, swatch + path + resolved).
  - **Value stored in args is the raw CSS var reference**: `var(--sb-color-brand-primary)`. No decorator substitution; the component receives exactly what's in args. Any control expecting a color string works.
  - Popover UI displays token path + resolved hex for the active theme as chrome; on selection, writes the corresponding `var(--…)` string to args via `updateArgs`.
  - Registered via `addons.register` → `controls` channel, using Storybook's `ControlProps` contract.

- **`useToken` hook**
  - `useToken('color.brand.primary')` reads from the virtual-module graph + current `globals.swatchbookTheme`. Returns `{ value, cssVar, type, description }`. Typed via generated union of token paths from `<outDir>/tokens.d.ts`.

### `@unpunnyfuns/swatchbook-blocks`
Doc blocks consumable from MDX. Each block reads the same virtual token graph.

- `<TokenTable filter="color.*" type="color" />` — columns: name, value, resolved, description; filter by glob and/or `$type`.
- `<ColorPalette group="color.brand" />` — swatch grid grouped by sub-path.
- `<TypographyScale />` — renders each typography-typed token as a sample line using its own value.
- `<TokenDetail path="color.brand.primary" />` — name, type, description, alias chain (`a → b → #…`), per-theme resolved values, usage snippet.

All blocks are presentational; theme state comes from Storybook globals via `useGlobals()` so they react to the toolbar.

## Critical files to create

- `packages/core/src/parse.ts` — glue to `@terrazzo/parser`. Must handle DTCG `$type` inheritance and `{alias}` references through the parser's resolver.
- `packages/core/src/themes/normalize.ts` — converges layered / DTCG-resolver / Tokens-Studio-manifest inputs into one `Theme[]`. Core's most complex file.
- `packages/core/src/css.ts` — stable CSS var naming: `--${prefix}${path.replaceAll('.', '-')}`. Composite tokens (typography, shadow) emit multiple sub-vars (`--typography-body-font-family`, `…-font-size`, etc.) plus a shorthand where applicable.
- `packages/core/src/diagnostics.ts` — typed diagnostic objects (`error`/`warn`/`info` + source location + message). All loaders push into the project's diagnostic list; preset surfaces them.
- `packages/addon/src/preset.ts` — virtual module plumbing + HMR is the trickiest piece; get this right before anything else.
- `packages/addon/src/controls/color.tsx` — study Storybook's built-in `ColorControl` for the registration contract.
- `packages/blocks/src/TokenTable.tsx` — reference implementation the other blocks follow.

## Dependencies

- `@terrazzo/parser` — DTCG parsing, alias resolution, validation
- `storybook@^10.3` (peer), `@storybook/react` (peer), `@storybook/manager-api`, `@storybook/preview-api`, `@storybook/components`, `@storybook/theming`, `@storybook/icons`
- `react`, `react-dom` (peer)
- `apps/storybook` dev deps: `storybook@^10.3`, `@storybook/react-vite`, `@storybook/addon-vitest`, `@storybook/addon-mcp`, `@vitest/browser`, `playwright`, `vite`
- Root dev deps: `turbo`, `typescript`, `tsup`, `vitest`, `oxlint`, `oxfmt`

## Token packages

Two separate packages with different audiences:

### `packages/tokens-reference` — private, exhaustive

The realistic multi-file DTCG pyramid. Private (`private: true`). Serves three jobs: the shared fixture for `@unpunnyfuns/swatchbook-core` unit tests, the dogfood target that the Storybook app consumes, and the living reference for every DTCG type + pattern the addon must handle. Maintained to production quality because our own tests depend on it.

Exports: the `tokens/` directory (via `package.json#files`) and a tiny `index.ts` that resolves absolute paths to the tokens dir and manifest — so downstream packages import paths without string-joining `node_modules`.

### `packages/tokens-starter` — published, opinionated

`@unpunnyfuns/swatchbook-tokens` — the public starter set. Small, tasteful, forkable. One ref palette, ~12 sys tokens, 2 themes (light/dark), no brand/contrast variants. Exists to be a low-friction entry point for consumers: `pnpm add @unpunnyfuns/swatchbook-tokens` → drop in CSS or import typed values.

Exports (tree-shakable):
- `./tokens/*` — raw DTCG JSON, for users who want to re-resolve with their own config.
- `./themes/light.json`, `./themes/dark.json` — prebuilt resolved theme JSON.
- `./css/light.css`, `./css/dark.css` — prebuilt CSS custom-property stylesheets.
- Default export — typed values object + `.d.ts` with the token-path union.

Built at `turbo run build` time by calling `@unpunnyfuns/swatchbook-core` on its own `tokens/` — which means the starter doubles as an end-to-end smoke test of the core package.

### Shape the rest of this section describes

The **reference** package. It's the one the tests, the Storybook app, and the "Fixture validates" list below all refer to. The starter is a scoped-down sibling that follows the same layer conventions but with fewer files and only 2 themes.

### Pyramid layers

```
tokens/
  ref/                          # raw primitives — no aliases, no semantics
    color.palette.json          # color.ref.blue.50 … 900, neutral, red, green, yellow
    size.scale.json             # size.ref.000 … 2000 (4px base)
    font.family.json            # font.ref.sans, .serif, .mono
    font.weight.json            # font.ref.weight.regular/medium/bold
    duration.json               # duration.ref.fast/normal/slow
    cubic-bezier.json           # easing.ref.standard/emphasized/decelerated
  sys/                          # semantic — aliases into ref; theme-neutral shape
    color.json                  # color.sys.surface.*, .text.*, .border.*, .accent.* → {color.ref.*}
    space.json                  # space.sys.xs/sm/md/lg/xl → {size.ref.*}
    radius.json                 # radius.sys.sm/md/lg/pill → {size.ref.*}
    typography.json             # typography.sys.body/heading/label (composite)
    shadow.json                 # shadow.sys.sm/md/lg (composite)
    motion.json                 # motion.sys.enter/exit (transition composite)
  cmp/                          # component — aliases into sys
    button.json                 # cmp.button.bg, .fg, .border, .radius, .padding-x …
    card.json                   # cmp.card.bg, .fg, .shadow, .radius, .padding
    input.json                  # cmp.input.bg, .fg, .border, .border-focus, .radius
  themes/                       # sparse overrides of sys (and occasionally cmp)
    light.json                  # default surface/text values
    dark.json                   # inverted surface/text; same sys paths
    brand-a.json                # alternate accent hue; overrides color.sys.accent.*
    high-contrast.json          # stronger borders + text; overrides + a11y-focused
  $themes.manifest.json         # Tokens Studio-style: named theme compositions
  resolver.json                 # DTCG 2025.10 native resolver expressing the same compositions
```

### Layer rules

- **ref**: no `$ref`/aliases. Pure values. Every ref file has a top-level `$type` group default where sensible.
- **sys**: every token is an alias into `ref`. Establishes the *shape* of the theme (which semantic slots exist). Shape is identical across themes — only values differ.
- **cmp**: every token is an alias into `sys` (occasionally `ref` for size-ish things). Components should never reference `ref` directly.
- **themes**: sparse — only override `sys` paths that differ from the default (`light`). Validates the addon's layer-merge semantics.

### Manifest

`$themes.manifest.json` models two axes to stress-test theme composition:

```json
{
  "$themes": [
    { "name": "Light",               "selectedTokenSets": { "ref/*": "source", "sys/*": "enabled", "cmp/*": "enabled", "themes/light":    "enabled" } },
    { "name": "Dark",                "selectedTokenSets": { "ref/*": "source", "sys/*": "enabled", "cmp/*": "enabled", "themes/dark":     "enabled" } },
    { "name": "Light · Brand A",     "selectedTokenSets": { "ref/*": "source", "sys/*": "enabled", "cmp/*": "enabled", "themes/light":    "enabled", "themes/brand-a": "enabled" } },
    { "name": "Dark · Brand A",      "selectedTokenSets": { "ref/*": "source", "sys/*": "enabled", "cmp/*": "enabled", "themes/dark":     "enabled", "themes/brand-a": "enabled" } },
    { "name": "High Contrast",       "selectedTokenSets": { "ref/*": "source", "sys/*": "enabled", "cmp/*": "enabled", "themes/high-contrast": "enabled" } }
  ]
}
```

`source` = loaded but not emitted as CSS vars (ref tokens stay private); `enabled` = loaded and emitted. All three paths — explicit `config.themes`, DTCG `resolver.json`, and Tokens Studio `$themes.manifest.json` — must produce the same resolved output for the same logical composition. A core unit test pins this three-way equivalence.

### Config showing all three modes

`apps/storybook/swatchbook.config.ts` ships the three compositions side-by-side (commented toggle):

```ts
export default defineConfig({
  tokens: ['node_modules/@unpunnyfuns/swatchbook-tokens-reference/tokens/**/*.json'],

  // Pick exactly one:

  // Option A: explicit layers
  // themes: [
  //   { name: 'Light', layers: ['.../ref/**', '.../sys/**', '.../cmp/**', '.../themes/light.json'] },
  //   { name: 'Dark',  layers: ['.../ref/**', '.../sys/**', '.../cmp/**', '.../themes/dark.json'] },
  // ],

  // Option B: DTCG 2025.10 resolver
  // resolver: '.../tokens/resolver.json',

  // Option C: Tokens Studio manifest
  manifest: '.../tokens/$themes.manifest.json',

  default: 'Light',
  cssVarPrefix: 'sb',
});
```

### What this fixture validates

- DTCG coverage: every primitive + composite type (`color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`, `typography`, `shadow`, `border`, `transition`).
- Deep alias chains: `cmp.button.bg` → `color.sys.surface.inverse` → `color.ref.neutral.900`. Resolver must traverse ≥2 hops and a core test asserts the full chain.
- Sparse overrides: dark/brand-a themes only redefine a handful of sys tokens; merge must preserve everything else from default.
- Theme composition: Light+Brand-A merges two theme files — order matters; last-write-wins.
- `source` vs `enabled`: ref tokens are resolvable from aliases but don't emit CSS vars, keeping the stylesheet small.
- Scoped prefix: with `cssVarPrefix: 'sb'`, `color.sys.surface.default` → `--sb-color-sys-surface-default`.

## Build / release

- Each publishable package builds with `tsup` (ESM + CJS + `.d.ts`).
- **Turborepo** handles orchestration and caching:
  - `turbo run build` — topological, with `core` → `blocks`/`addon` → `apps/storybook` dependency graph.
  - `turbo run test` — runs Vitest in every package (unit tests).
  - `turbo run test:storybook` — runs Storybook Test (Vitest addon) in `apps/storybook` only, depends on `^build` so packages are built first.
  - `turbo run storybook` — `dev` task for `apps/storybook`, `persistent: true`, `cache: false`.
  - `turbo run build:storybook` — static build of the docs site into `apps/storybook/storybook-static/`.
  - `turbo run lint` / `format` / `typecheck` — fan out across workspace.
- Pipeline outputs declared so turbo caches correctly: `dist/**` for packages, `storybook-static/**` for the app.
- Root scripts thin-wrap turbo commands.
- `apps/storybook` is `private: true` — never published. Deploy is deferred; a static build is produced by CI and can be hosted on GH Pages / Netlify / Cloudflare Pages later.

## Error surface

Token-loading problems should be *visible*, not silent. Pipeline:

1. Core's `loadProject` collects `Diagnostic[]` (non-throwing for recoverable issues — unknown type, missing alias, duplicate path, composite sub-value type mismatch — throwing only on unreadable files / invalid JSON).
2. Preset's build-time pass logs diagnostics to the Storybook terminal, with severity colors. Build fails on `error`-severity diagnostics unless `parameters.swatchbook.strict === false`.
3. Runtime: the addon's Panel has a "Diagnostics" tab showing the same list, grouped by severity. Empty state = green "OK" badge on the tab.
4. A failed resolve in `useToken` returns a sentinel value (`'unresolved'` + logs once) rather than throwing — stories keep rendering.

## Workspace root

Root `package.json` currently uses `"@unpunnyfuns/swatchbook"`. Rename to neutral `"swatchbook-monorepo"` with `"private": true` before scaffold. Keeps the scoped name free for a future published meta-package (or reclaim it later if we want a single-package face).

## CI

GitHub Actions pipeline (`.github/workflows/ci.yml`):

- Matrix: latest Node LTS only (Node 24 today; bump with each LTS). See `docs/decisions.md`.
- Cache: pnpm store, Turbo local cache, Playwright browsers.
- Steps: `pnpm install --frozen-lockfile` → `pnpm turbo run lint format:check typecheck test build` → `pnpm turbo run test:storybook` → `pnpm turbo run build:storybook`.
- Quality gates per package: `lint` (oxlint), `format:check` (oxfmt), `typecheck` (tsc --noEmit), `test` (Vitest). Turbo task-level inputs reference `$TURBO_ROOT$/.oxlintrc.json` and `$TURBO_ROOT$/.oxfmtrc.json` so cache keys invalidate when the configs change.
- Storybook static build (`turbo run build:storybook`) uploaded as artifact; deploy step deferred.
- No Turbo remote cache in v1 (can add `TURBO_TOKEN`/`TURBO_TEAM` env secrets later).

## Dev environment (repo-local)

Checked in at repo root so future Claude sessions and teammates pick them up automatically.

### DTCG skill

`.claude/skills/dtcg-tokens/SKILL.md` — a Claude skill that loads when work touches DTCG tokens. Content: the 2025.10 stable spec in condensed form — every token type (primitive + composite) with an example, `$value`/`$type`/`$description`/`$extensions`/`$deprecated` semantics, alias syntax (`{group.token}` and JSON Pointer `$ref`), group `$type` inheritance, modern color spaces, token resolvers, and the Tokens Studio `$themes` manifest convention (since the spec itself doesn't standardize theming yet). Frontmatter triggers on keywords like `DTCG`, `design token`, `$value`, `$type`, files under `packages/tokens-*/`, and `.tokens.json` / `.dtcg.json` extensions. Keep it punchy — a reference card, not an essay. Link out to the upstream spec for edge cases rather than duplicating it.

### Storybook MCP server

`apps/storybook` installs `@storybook/addon-mcp` (requires Storybook 10.3+). The addon exposes component metadata, stories, and screenshots over MCP at the Storybook dev-server URL (`http://localhost:6006/mcp` by default) — lets Claude introspect the live docs site while working on the addon.

`.mcp.json` at repo root registers the server. **Operational note**: the MCP endpoint only exists while Storybook is running; tools will 404 otherwise. Document in root README:

```
# Terminal 1
pnpm dev           # = turbo run storybook, launches Storybook on :6006
# Terminal 2
claude             # MCP tools for Storybook now resolve
```

Root README should also note that starting Claude before Storybook will cause the MCP handshake to fail silently — users should restart Claude after Storybook comes up if they forget the order.

## Plan governance

The plan is the **design doc**; GitHub milestones/issues are the **tracker**. Don't merge them — the plan says *why*, the tracker says *where we are*.

### In-repo location

- `docs/plan.md` — this file, committed at scaffold (M0). Copied from `/Users/palnes/.claude/plans/this-is-an-empty-snazzy-ocean.md` and renamed.
- `docs/decisions.md` — append-only ADR-lite log for scope/approach changes made during execution. Entry format: date, decision, rationale, superseded-by link.
- `docs/terrazzo-notes.md` — output of the M0 spike (capability audit of `@terrazzo/parser`).
- `CLAUDE.md` at repo root — orients future Claude sessions. Points at `docs/plan.md`, links the DTCG skill, names the current milestone, and lists the key conventions from the user's global CLAUDE.md that apply here (oxlint/oxfmt, functional style, Vitest, no CSS-in-JS, etc.).

### Tracking state

- GitHub milestones **M0–M9** created at scaffold, names matching this plan.
- One issue per "Work" bullet under each milestone. Each issue links back to the relevant `docs/plan.md` section anchor.
- Root README carries a one-line `Current: Mx — <goal>` status that updates when a milestone closes.

### Branch & PR workflow

All work after the M0 scaffold commit flows through PRs. Direct pushes to `main` are reserved for the initial scaffold only.

- **Branch per logical chunk**, not per tiny issue. Typical M1 cut: `m1/tokens-reference`, `m1/core-impl`, `m1/core-tests`, `m1/tokens-starter-skel`. Branch names start with the milestone slug (`m1/…`, `docs/…`, `chore/…`).
- **PR title:** **Conventional Commits** format — `<type>(<scope>): <description>`. Types: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `perf`, `build`, `revert`. Scope is the package or app slug: `core`, `addon`, `blocks`, `tokens-reference`, `tokens-starter`, `storybook`, `ci`, or omit for repo-wide. The milestone (`M3`) lives in the PR body's `Milestone:` line, never in the title — squash-merge lands the title as the commit on `main`, so keep it machine-parseable for future Changesets / release-notes automation.
  - ✅ `feat(addon): preset + virtual module + preview decorator`
  - ✅ `fix(tokens-reference): accent hits WCAG AA against white fg`
  - ✅ `chore(ci): bump GH Actions to latest majors`
  - ❌ `M3: addon preset + virtual module`
  - ❌ `Update addon`
- Body follows the PR template verbatim. Link related milestone issues with `Closes #N` / `Refs #N`.
- **Merge strategy:** squash-merge by default. Preserve commits only when the history is genuinely useful to future readers.
- **No self-merge by automation.** Claude (or any agent) opens PRs; the human reviewer merges. This keeps the governance human-in-the-loop.
- **Branch protection** on `main` is the repo owner's call — the discipline above holds either way, but enabling protection rules (require PR, require status checks, restrict pushes) in GitHub settings makes it enforced rather than norm-based.

### Keeping the plan honest

Two mechanisms:

1. **PR template** (`.github/pull_request_template.md`) with two required lines: `Milestone:` and `Plan impact: [none | update included | decisions.md entry]`. Forces the question at review time.
2. **Rule**: any PR that invalidates a section of `docs/plan.md` MUST include the plan diff in the same PR. Reviewers reject PRs that silently drift from the plan. Small scope tweaks go to `decisions.md`; large ones edit the plan body and note the change in `decisions.md`.

### When to rewrite vs append

- **Edit plan body** for: new decisions that replace old ones (e.g. switching builders, dropping a feature), structural changes (new package, renamed export), milestone redefinition.
- **Append to `decisions.md`** for: tactical choices that don't change the design intent (e.g. "picked `tsup` over `unbuild` because of X"), post-merge observations, deprecations.
- **Neither** for: day-to-day implementation details — those live in commit messages and issue comments.

## Milestones

Each milestone has a single measurable demo step. Progress is tracked by which milestones are green.

### M0 — Foundation
**Goal:** Empty but fully wired monorepo; scope of core is confirmed; governance in place.
**Work:**
- Spike: read `@terrazzo/parser` API + source; prototype loading a small DTCG file; verify alias chains, multi-file merge, composite emission, diagnostic surface. Produce `docs/terrazzo-notes.md`.
- Pin exact Storybook version (confirm 10.3+ current stable; record the minor).
- Rename root `package.json` → `swatchbook-monorepo` (`private: true`).
- Create `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore` (ignores `.swatchbook/`, `dist/`, `storybook-static/`), oxlint/oxfmt config (confirm monorepo support), shared `tsup.config` helper, GH Actions CI skeleton.
- **Governance**: copy this plan into `docs/plan.md`; create empty `docs/decisions.md` with header; write `CLAUDE.md` at repo root; add `.github/pull_request_template.md` with `Milestone:` / `Plan impact:` lines; open GitHub milestones M0–M9 and seed one issue per "Work" bullet.
- Adjust downstream plan if audit reveals gaps.

**Exit:** `pnpm install && pnpm turbo run lint typecheck` green on empty packages. CI runs on PR. Terrazzo note committed.
**Demo:** CI badge green on the scaffold commit.

### M1 — Core (`@unpunnyfuns/swatchbook-core`)
**Goal:** DTCG loading + three-way theming + CSS/types emission, fully tested.
**Work:**
- Author `packages/tokens-reference`: ref/sys/cmp/themes + `$themes.manifest.json` + `resolver.json`.
- Implement core: `parse`, `themes/{layered,resolver,manifest,normalize}`, `css`, `emit`, `diagnostics`, public `index.ts`.
- Vitest unit tests off `tokens-reference`: alias chains ≥2 hops, sparse override merge, prefix option, every primitive + composite type, all three theming inputs → byte-identical CSS.
- Minimal `packages/tokens-starter` skeleton (one theme) wired to `core.emitCss` + `core.emitTypes` — catches emission regressions early.

**Exit:** `turbo run test --filter core` green; `turbo run build --filter tokens-starter` produces `dist/css/light.css` and `dist/tokens.d.ts`.
**Demo:** `cat packages/tokens-starter/dist/css/light.css` shows expected CSS vars.

### M2 — Baseline Storybook app
**Goal:** `apps/storybook` builds and renders demo components styled by real tokens — no swatchbook addon yet.
**Work:**
- Scaffold `apps/storybook` on the pinned Storybook version with React-Vite.
- Add demo components (Button, Card, Input) styled with `var(--sb-cmp-…)`.
- Import `tokens-reference` CSS directly (static `<link>`) so something works before the addon arrives.
- Install `@storybook/addon-mcp`. Register in `.mcp.json`.

**Exit:** `turbo run storybook` serves the app; `turbo run build:storybook` produces `storybook-static/`.
**Demo:** Visit `http://localhost:6006` — Button/Card/Input stories render fully themed.

### M3 — Addon runtime
**Goal:** Live theme switching in Storybook driven by the swatchbook addon.
**Work:**
- `@unpunnyfuns/swatchbook-addon`: preset + Vite virtual module (`virtual:swatchbook/tokens`) + HMR + preview decorator.
- Toolbar theme switcher tool with composition chips + source badges.
- Wire into `apps/storybook`; remove the temporary static `<link>` from M2.

**Exit:** Toolbar dropdown changes `data-theme`, CSS vars repaint. Editing a token file in `tokens-reference` hot-reloads the preview with new values.
**Demo:** Pick "Dark · Brand A" in toolbar → demo components reflect the stacked composition instantly.

### M4 — Token browsing + typed hook
**Goal:** Authors can introspect tokens and read them from JS with full types.
**Work:**
- Panel: **Tokens** tab (searchable, grouped by `$type`, click → copy `var(--…)`) + **Diagnostics** tab (error/warn/info, green OK badge when empty).
- `useToken` hook reading from the virtual graph + active theme; returns `{ value, cssVar, type, description }`.
- Preset runs `emitTypes(project)` to `.swatchbook/tokens.d.ts`; consumer tsconfig includes it.

**Exit:** Panel lists every token from `tokens-reference`; `useToken('color.sys.surface.default')` returns the resolved value with autocomplete; theme switch updates the value.
**Demo:** Story uses `useToken` and renders its return value as text; Tokens panel search filters down to a single result.

### M5 — Token-aware color control
**Goal:** Replace Storybook's default color picker for color-typed args.
**Work:**
- `swatchbook-color` argType: searchable popover of color tokens (swatch + path + resolved), writes `var(--…)` directly to args via `updateArgs`.
- Sample story in `apps/storybook`: `argTypes: { bg: { control: 'swatchbook-color' } }`.

**Exit:** Selecting a token writes `var(--sb-color-…)` to args; component re-renders with that value; Args tab is honest (shows exactly what the component receives).
**Demo:** Pick a token from the popover → both the rendered component and the Args panel update.

### M6 — Doc blocks
**Goal:** Rich MDX documentation of tokens.
**Work:**
- `@unpunnyfuns/swatchbook-blocks`: `TokenTable`, `ColorPalette`, `TypographyScale`, `TokenDetail`.
- MDX pages in `apps/storybook/src/docs/` exercising each block.

**Exit:** All four blocks render in MDX; every block reacts to toolbar theme change.
**Demo:** `/docs/tokens/colors` MDX page shows a full ColorPalette + TokenTable; switching theme updates both live.

### M7 — Interaction tests
**Goal:** Automated coverage of the addon's Storybook behavior.
**Work:**
- Enable `@storybook/addon-vitest`; write `vitest.config.ts` with Storybook project.
- Play-function tests: theme switch, stacked theme composition, token-picker args, each doc block, diagnostics-panel recovery (seed an invalid token, fix it, assert clean).
- **Multi-theme test fan-out via the addon.** Expose `swatchbookThemeProjects({ configDir })` from `@unpunnyfuns/swatchbook-addon/vitest` — reads the swatchbook config (same path the preset uses), returns one Vitest project per theme with `initialGlobals` set. Consumers drop it into their `vite.config.ts#test.projects` and every story runs under every theme. Turns the a11y gate from Light-only into full-matrix coverage. Explore cleanest injection path (addon-vitest's `initialGlobals` isn't exposed as a plugin option today — may require a setup file that pokes Storybook's globals channel).

**Exit:** `turbo run test:storybook` green in CI.
**Demo:** CI run shows a green Storybook Test job with the expected number of passing tests.

### M8 — Public starter + documentation
**Goal:** A consumer can install swatchbook from npm and use it.
**Work:**
- Flesh out `packages/tokens-starter`: slim ref + sys + 2 themes; prebuilt `dist/themes/*.json`, `dist/css/*.css`, `dist/index.{js,d.ts}`.
- READMEs per package (module name + one-liner, structure table, TS examples, ✅/❌ do's/don'ts).
- Root README: install flow, MCP startup order, link to each package.

**Exit:** `npm pack --dry-run` on each published package lists the expected files; cold `pnpm add` install in a throwaway repo works and CSS renders.
**Demo:** `pnpm dlx create-vite demo && cd demo && pnpm add @unpunnyfuns/swatchbook-tokens` → import CSS → demo renders styled.

### M9 — v0.1.0 release
**Goal:** First public release under `@unpunnyfuns`.
**Work:**
- Configure Changesets for version bumps + changelogs.
- Publish workflow in CI (npm token, provenance).
- Cut `v0.1.0`, tag, release notes.

**Exit:** `@unpunnyfuns/swatchbook-core`, `@unpunnyfuns/swatchbook-addon`, `@unpunnyfuns/swatchbook-blocks`, `@unpunnyfuns/swatchbook-tokens` all on npm at the same version.
**Demo:** Fresh clone of the demo repo from M8 pins the released versions and installs without workspace links.

### Progress tracking

Create GitHub milestones matching M0–M9. Each PR references its milestone. An "M-status" line in the root README tracks `Current: Mx — <goal>`.

## Verification

- `pnpm turbo run test` — unit tests (Vitest) across `core` and `blocks`. Core covers: DTCG alias resolution, layer merge order, three-way theming equivalence (layered / resolver / manifest → byte-identical CSS), CSS var emission for all primitive + composite types, prefix option, diagnostics surface.
- `pnpm turbo run test:storybook` — Storybook Test (Vitest addon) in `apps/storybook` covers:
  - Theme switcher toggles `data-theme` and updates rendered colors; stacked compositions (e.g. "Light · Brand A") merge in the correct order.
  - Token picker control lists color tokens only and writes `var(--…)` directly to args; component renders with that value unchanged.
  - Each doc block (TokenTable, ColorPalette, TypographyScale, TokenDetail) renders against the reference token graph and reacts to theme change.
  - `useToken` returns the resolved value for the active theme and updates on theme switch.
  - Diagnostics panel shows a seeded invalid-token scenario and recovers when the file is fixed.
- `pnpm turbo run storybook` — launch the app manually for visual sanity (search in tokens panel, alias chains, composite rendering).
- `pnpm turbo run build` — all packages emit `dist/`; `apps/storybook` emits `storybook-static/`.
- `pnpm turbo run lint typecheck` — oxlint + `tsc --noEmit` across the graph.
- Declared Storybook peer range verified by building `apps/storybook` against it (the app pins the supported version).
