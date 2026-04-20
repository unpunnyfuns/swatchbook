# Swatchbook — Claude orientation

Storybook addon + doc blocks for DTCG design tokens. Monorepo under `@unpunnyfuns`.

## Current state

`v0.4.0 shipped` — three fixed-group packages (core / addon / blocks) published via Changesets + trusted publishing. Documentation site live at https://unpunnyfuns.github.io/swatchbook/ with multi-version support (`/next/` for main, `/` for the latest release, older minors browsable via the version dropdown).

Post-0.4.0 landscape:

- **Block chrome config** (PR #388): blocks read ten chrome variables in a fixed `--swatchbook-*` namespace independent of `cssVarPrefix`; `DEFAULT_CHROME_MAP` holds hard-coded literals using `light-dark()` so zero-config chrome auto-flips with Storybook/OS color-scheme. `config.chrome = { surfaceDefault: 'color.brand.bg.primary', … }` wires individual roles to consumer tokens. The old `chromeAliases()` + prefix-rewiring inline style on every block wrapper is retired.
- **Blocks styling migration** (PRs #384, #391, #393, #395, #397, #399): every block under `packages/blocks/src/` (Diagnostics, type-preview, scale, font+color, navigator+table, TokenDetail+subtree) moved from inline `const styles = {...}` objects to colocated `.css` files with BEM-ish `sb-<block>__<part>--<modifier>` class names and `clsx` for composition. `.sb-unstyled` scoping replaces the earlier `block-reset.ts` workaround. See issue #375 for the umbrella.

Post-0.3.0 landscape (still accurate):

- **Panel → docblock migration** complete. The addon's in-manager Design Tokens panel was removed in v0.3.0 (PR #350). Consumers compose `<Diagnostics />` + `<TokenNavigator />` + `<TokenTable />` on an MDX page via the [token-dashboard guide](https://unpunnyfuns.github.io/swatchbook/guides/token-dashboard).
- **TokenTable redesign** in v0.3.0 (PR #359): compact two-column layout with click-to-open `<TokenDetail>` drawer, shared with `<TokenNavigator>`'s drawer via `internal/DetailOverlay.tsx`.
- **sortBy/sortDir + default-filter fix** (PR #349): every list-style block takes `sortBy`/`sortDir` props and the broken `filter = '$type'` defaults were removed.
- **`formatTokenValue`** (PR #346): single entry point for per-`$type` value stringification across every block, honoring the color-format dropdown for color sub-values of composites (shadow, border, gradient).

Update this section when the state genuinely shifts. See the matching GitHub milestones for per-issue state.

### Milestone taxonomy

GitHub milestones are scope buckets, not a sequence. Currently active:

- **Maintenance** — hygiene, refactors, CI polish, cleanup. The default home for most post-v0.3.0 work.
- **Release** — Changesets versioning, publish workflow, cutting tags. Dormant between releases; active when a minor/major is queued.
- **Feature milestones** — named scope areas. Spun up per-effort when a coherent push lands (e.g. *Block value display + chrome consistency*, *Panel → docblock migration* — both closed as of v0.3.0). No implied ordering.

When filing an issue: feature work → the relevant scope milestone if one's active. Repo hygiene → *Maintenance*. Release plumbing → *Release*.

## Project conventions

- **Latest deps policy:** always pin the latest stable major/minor of every third-party dependency unless a concrete blocker is documented in `docs/decisions.md`. When adding a dep, check `npm view <pkg> version` and use that. Default to eager upgrades — we'd rather hit new-version friction early than accumulate a drift debt.
- **ESM only.** Every package is `"type": "module"`. No CJS builds, no dual-format outputs, no `require()`-compatible fallbacks. Package builds emit ESM only (`tsdown --format esm`). If a downstream consumer still needs CJS, that's their problem to solve with a bundler.
- **Bundler:** `tsdown` (rolldown-powered). Never add `tsup` — it's deprecated.
- **Source layout:** every package keeps its code under `./src/`. Package root holds config only (`package.json`, `tsconfig.json`, `README.md`). Build output goes to `./dist/`.
- **Import specifiers: explicit extensions, always.** Relative and subpath imports both carry the extension that's on disk — `.ts`, `.tsx`, `.css`, `.json`, `.svg`, whatever. `allowImportingTsExtensions + noEmit` in the base tsconfig makes TS happy; Vite, Vitest, tsdown, Node strip-types all resolve `.ts` / `.tsx` specifiers natively. The rule is *what you see is what's imported* — no extension inference, no "fake `.js`".
- **Internal aliasing: `package.json#imports` with `#/` prefix + extension-agnostic target.** The map is just `"#/*": "./src/*"`; the extension lives on the specifier. One entry handles every filetype.
  ```json
  { "imports": { "#/*": "./src/*" } }
  ```
  ```ts
  import { emitCss } from '#/css.ts';          // ✅
  import { Button }  from '#/components/Button.tsx'; // ✅
  import tokens     from '#/tokens/color.json';  // ✅
  import logo       from '#/assets/logo.svg';        // ✅
  import './styles.css';                             // ✅
  import { foo }    from '#/foo';                    // ❌ no extension
  import { bar }    from '../bar';                   // ❌ no extension
  ```
  The leading slash in `#/` lands cleanly because Node 24.14+ supports `#/`-prefixed subpaths. TypeScript (5.4+), Vite, and Vitest all honor `package.json#imports` natively — no `tsconfig#paths`, no `resolve.alias`. Don't add them.
- **Node baseline:** always the **latest LTS** everywhere — dev, CI matrix, published `engines.node`. Today that's Node 24. When a new LTS lands (typically October of even years), bump engines + CI in a same-day PR. Don't add lower-version compat paths, polyfills, or matrix entries for older Node.
- **CI Playwright image:** CI runs inside a GHCR mirror of the Playwright image, pinned in `.github/workflows/ci.yml` as `ghcr.io/<repo>/playwright:vX.Y.Z-noble`. Chromium + system deps come pre-installed; GHCR pulls are ~3-5s on GHA runners vs ~27s from MCR. The mirror is maintained by `.github/workflows/mirror-playwright.yml` (manual dispatch). **On Playwright upgrade:** (1) bump `playwright` in `apps/storybook/package.json`; (2) dispatch the Mirror Playwright workflow with the new tag; (3) verify the new tag under repo Packages; (4) update the `container.image` tag in `ci.yml` + this bullet in the same PR.
- **Package manager:** pnpm@10.33.0 (workspaces); orchestration via Turborepo.
- **Code style:** functional, avoid classes/singletons. No CSS-in-JS. No inline end-of-line comments.
- **Lint/format:** `oxlint` + `oxfmt`. Never `npx biome`.
- **Tests:** Vitest everywhere. Storybook Test (via `@storybook/addon-vitest`) for interaction tests in `apps/storybook`.
- **Test structure: flat.** Each `it` reads top-to-bottom without scrolling up — per Kent C. Dodds's [Avoid Nesting When You're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing).
  - **No nested `describe`.** One `describe` per file at most, as a file-level grouping. If you feel the urge to nest, split files instead.
  - **No `beforeEach`** for cosmetic shared setup. Write an inline `setup()` helper and have each test call it; duplicating a line or two beats the "what is `user` here?" hunt.
  - **`beforeAll` is a perf escape hatch**, not a grouping tool. Acceptable only when the shared setup is genuinely expensive (e.g. `loadProject` takes ~1s so running it per-test would blow the timeout) and the alternative would be a meaningful regression. Annotate the reason inline.
  - Prose over jargon in test names: `` it('resolves alias chains (role → primitive)') `` beats `` it('resolves') `` inside nested describes.
- **Pre-commit checks (always, no exceptions):** before running `git commit`, run
  ```
  pnpm -r format && pnpm turbo run lint typecheck test
  ```
  Format changes to already-staged files land as noisy follow-up commits; CI fails on lint/typecheck/test regressions. Running all four locally catches every class before the push. If something is too slow, scope with `--filter=<pkg>` — don't skip.
- **Design tokens:** flat paths organized per DTCG `$type`, following [Terrazzo's style guide](https://terrazzo.app/docs/guides/styleguide/). Primitives (color, dimension, duration, fontFamily, fontWeight, cubicBezier, number, strokeStyle) and composites (shadow, border, transition, gradient, typography) coexist under their type root — `color.palette.blue.500` alongside `color.surface.default`, `size.100` alongside `space.md`, `duration.fast` alongside `transition.enter`. No tier prefix in paths. Variation across `mode`, `brand`, `contrast` lives in resolver modifiers.
- **TypeScript:** strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` on.
- **READMEs:** module name + one-liner; structure table; TypeScript examples with imports; ✅/❌ for do's/don'ts.

## DTCG skill

`.claude/skills/dtcg-tokens/SKILL.md` — reference card for the DTCG 2025.10 spec. Loads automatically when working on token files; consult it before writing or editing `.tokens.json` / `.dtcg.json` content.

## Storybook addon gotchas

- **Manager bundle**: use `React.createElement` (or a local `h` alias), **not JSX**. Storybook's manager page runs React 18 and doesn't expose `react/jsx-runtime`'s React-19 dispatcher — JSX in manager code crashes with *"Cannot read properties of undefined (reading 'recentlyCreatedOwnerStacks')"*. Preview code is fine with JSX (runs on the consumer's React).
- **Register tools via element-returning function**: `render: () => h(ThemeToolbar)` — passing the component function directly (`render: ThemeToolbar`) invokes hooks outside React's render cycle.
- **Preview ↔ manager comms**: use Storybook's channel (`addons.getChannel()` + `emit`/`on`). The manager can't import preview-side Vite virtual modules.
- **CSF Next addons**: default-export a factory that returns `definePreviewAddon(previewExports)` (from `storybook/internal/csf`). Consumers opt in via `definePreview({ addons: [swatchbookAddon()] })`.
- **MDX doc blocks can't use story hooks**: `useGlobals` / `useArgs` / `useChannel` / `useParameter` from `storybook/preview-api` all require the preview HooksContext, which only exists while a story is rendering. Called from an MDX doc block they throw *"Storybook preview hooks can only be called inside decorators and story functions."* For cross-story reactivity in MDX, subscribe to `addons.getChannel()` directly (`globalsUpdated` is the event) and manage state with plain React hooks.

## Storybook MCP

`apps/storybook` runs an MCP server via `@storybook/addon-mcp` at `http://localhost:6006/mcp`. The MCP endpoint only exists while Storybook is running — start it in one terminal before using MCP tools in another.

```
# Terminal 1
pnpm dev           # = turbo run storybook
# Terminal 2
claude
```

## Releases

- **Versioning:** [Changesets](https://github.com/changesets/changesets). Config in `.changeset/config.json`. The three published packages — `@unpunnyfuns/swatchbook-core`, `@unpunnyfuns/swatchbook-addon`, `@unpunnyfuns/swatchbook-blocks` — are grouped as `fixed`: they always carry the same version and release together. Private workspaces (root, `apps/storybook`, `tokens-reference`, `tokens-starter`) are listed under `ignore` so they never appear in bump prompts or get published.
- **Writing a changeset:** any PR with a user-visible change to the fixed-group packages runs `pnpm changeset` locally, picks the bump type (`patch` / `minor` / `major`), and commits the generated `.changeset/*.md` alongside the change. Purely internal refactors and doc-only PRs can skip it.
- **Publishing flow:** on `main`, Changesets' GitHub Action opens a "Version Packages" PR that consumes queued `.changeset/*.md` entries, bumps `package.json` versions, and regenerates `CHANGELOG.md`. Merging that PR runs `pnpm release` (builds + `changeset publish`) which pushes tags to GitHub and publishes to npm via trusted publishing (GitHub OIDC → short-lived npm token; no `NPM_TOKEN` secret, provenance attestation on). See `.github/workflows/release.yml`.
- **Docs versioning:** `scripts/snapshot-docs-version.mjs` snapshots `apps/docs/docs/` into `apps/docs/versioned_docs/version-<minor>/` and updates `versions.json` + `versioned_sidebars/`. Run it when cutting a new minor (the current `docs/` tree becomes the new released version; `main`'s `docs/` keeps serving at `/next/`). Turbo's `build` task includes `versioned_docs/**`, `versioned_sidebars/**`, `versions.json` in its input hash so the remote cache invalidates when a snapshot lands (PR #362 — without this, a fresh minor silently serves the previous minor's HTML).

## Plan governance

- Plan body edits → same PR as the change they reflect.
- Tactical choices that don't change design intent → append to `docs/decisions.md`.
- PR template (`.github/pull_request_template.md`) requires `Milestone:`, `Closes:`, and `Plan impact:` lines — don't remove them.
- Every PR links an existing GitHub issue. File one first if needed: `gh issue create --milestone "Mx — …" --title "…"`. Merging the PR auto-closes the issue; milestones close automatically when the last issue is done.
- **PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)**: `<type>(<scope>): <description>`. Types: `feat` / `fix` / `chore` / `docs` / `test` / `ci` / `refactor` / `perf` / `build` / `revert`. Scope is a package slug (`core`, `addon`, `blocks`, `tokens-reference`, `tokens-starter`, `storybook`, `docs`, `ci`) or omitted. Milestone goes in the PR body, never the title — squash-merge lands the title on `main`.
- **Issue vs PR references in prose:** GitHub shares a numeric namespace between issues and pull requests, and both render as `#N`. When referencing either in prose (status updates, CLAUDE.md, commit bodies, chat), **prefix with `issue` or `PR` — e.g. "issue #77", "PR #83"**. Inside PR bodies and issue comments the bare `#N` is fine because GitHub renders the linked page with an unmistakable type header; prose lacks that cue and ambiguity stings when you go looking weeks later.
