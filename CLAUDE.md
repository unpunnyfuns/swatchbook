# Swatchbook — Claude orientation

Storybook addon + doc blocks for DTCG design tokens, built on [Terrazzo](https://terrazzo.app/)'s parser. Monorepo under `@unpunnyfuns`.

## Scope framing — preview host, not token transformer

**Critical to keep straight.** Swatchbook is the preview side of a Terrazzo pipeline: parses DTCG, displays tokens inside Storybook, reacts to the toolbar's axis flips. It does **not** transform tokens for production platforms — that's the consumer's `@terrazzo/cli` build. We accept user-provided `Plugin` objects via `config.terrazzoPlugins` (same relationship Vite has to Rollup plugins) and display what those plugins emit; we don't ship a transform-customisation API of our own.

When a proposal frames swatchbook as owning transform logic, custom naming schemes, our own plugin protocol, or "competing" with Style Dictionary / Terrazzo CLI, push back. The right answer is almost always "point the user at their existing tool and read its output via the listing."

## Current state

`v0.20.1 shipped`. Six published packages in a fixed-version Changesets group — `core`, `addon`, `blocks`, `switcher`, `integrations`, `mcp` — plus private workspaces (`tokens`, `apps/docs`, `apps/storybook`). Documentation site at https://unpunnyfuns.github.io/swatchbook/ with Docusaurus 3.10 + Faster (Rspack); single versioned snapshot per minor under `apps/docs/versioned_docs/`. Pre-1.0; routine breaking changes take a **minor** bump.

Architectural pillars settled this era:

- **Token Listing adoption.** `@terrazzo/plugin-token-listing` runs in core's in-memory build and produces `Project.listing[path]` — per-token `names.<platform>`, `previewValue`, `source.loc`, alias-resolved `originalValue`. Blocks read authoritative CSS var names from `listing[path].names.css` via `resolveCssVar()` (single source of truth, no parallel kebab-casing). Composite preview values come from the same listing — `<TokenTable>`, `<TokenDetail>`, `<ColorTable>` show what the consumer's plugin-css produces, not a parallel stringification. Format is `0.1.0-alpha.1` upstream — coupled to its output JSON; insulated by `computeTokenListing` which can swap to direct `getTransforms` consumption if the format churns.
- **Terrazzo alignment surface** on `Config`: `cssOptions`, `listingOptions`, `terrazzoPlugins`. Forward into the internal Terrazzo build so a single shared options module keeps consumer's production CLI and our preview build in lockstep. `cssOptions` strips `variableName` / `permutations` / `filename` / `skipBuild` (load-bearing); `swatchbook/css-options` warn diagnostic for the soft-inert `baseSelector` / `baseScheme` / `modeSelectors` trio. `@terrazzo/parser` and `@terrazzo/plugin-css` are declared as peer deps on core to enforce single-shared-instance via pnpm hoist.
- **Chromatic CI.** `.github/workflows/chromatic.yml` publishes the reference Storybook on push + PR. `parameters.chromatic.pauseAnimationAtEnd: true` globally; MotionSample detects Chromatic's user-agent inside `usePrefersReducedMotion` and renders its static fallback so setInterval-driven loops don't snap-to-different-frames each run. Heavy-DOM stories (TokenNavigator, TokenTable) carry a `chromatic.delay: 400` on their meta. Build runs through turbo so `^build` builds workspace-package deps first. Don't add the global `chromatic.prefersReducedMotion: true` parameter — it broke Chromatic's verification parser in our setup (rolled back in commit 893331f).
- **Block-chrome config** stays accurate: blocks read ten roles from a fixed `--swatchbook-*` namespace independent of `cssVarPrefix`; `DEFAULT_CHROME_MAP` uses `light-dark()` literals so zero-config chrome auto-flips with Storybook/OS color-scheme. `config.chrome = { surfaceDefault: 'color.brand.bg.primary', … }` wires individual roles to consumer tokens.

Update this section when state genuinely shifts. See GitHub milestones for per-issue state.

### Milestone taxonomy

- **Maintenance** — hygiene, refactors, CI polish, cleanup. Default home for most ongoing work.
- **Release** — Changesets versioning, publish workflow, cutting tags. Active when a minor is queued.
- **Feature milestones** — named scope areas. Spun up per-effort when a coherent push lands.

## Project conventions

- **Latest deps policy:** always pin the latest stable major/minor of every third-party dep unless a concrete blocker is documented. `npm view <pkg> version` when adding. Eager upgrades; we'd rather hit new-version friction early than accumulate a drift debt.
- **ESM only.** Every package is `"type": "module"`. No CJS, no dual-format outputs, no `require()` fallbacks. tsdown emits ESM only (`--format esm`).
- **Bundler:** `tsdown` (rolldown-powered). Never add `tsup` — deprecated.
- **Source layout:** code under `./src/`. Package root holds config only. Build output to `./dist/`.
- **Import specifiers: explicit extensions, always.** `.ts`, `.tsx`, `.css`, `.json`, `.svg`. `allowImportingTsExtensions + noEmit` in base tsconfig keeps TS happy; Vite, Vitest, tsdown, Node strip-types all resolve `.ts` / `.tsx` natively.
- **Internal aliasing:** `package.json#imports` with `#/` prefix, extension-agnostic target.
  ```json
  { "imports": { "#/*": "./src/*" } }
  ```
  ```ts
  import { emitCss } from '#/css.ts';                    // ✅
  import { Button }  from '#/components/Button.tsx';     // ✅
  import tokens     from '#/tokens/color.json';          // ✅
  import logo       from '#/assets/logo.svg';            // ✅
  import './styles.css';                                 // ✅
  import { foo }    from '#/foo';                        // ❌ no extension
  import { bar }    from '../bar';                       // ❌ no extension
  ```
  Node 24.14+ supports `#/`-prefixed subpaths. TypeScript 5.4+, Vite, Vitest honor `package.json#imports` natively — no `tsconfig#paths`, no `resolve.alias`.
- **Node baseline:** latest LTS everywhere — dev, CI matrix, published `engines.node`. Today: Node 24. Bump engines + CI in a same-day PR when the next LTS lands.
- **CI Playwright image:** GHCR mirror pinned in `.github/workflows/ci.yml` as `ghcr.io/<repo>/playwright:vX.Y.Z-noble`. Mirror maintained by `.github/workflows/mirror-playwright.yml` (manual dispatch). On Playwright upgrade: bump `playwright` in `apps/storybook/package.json`, dispatch the mirror workflow with the new tag, verify the new tag under repo Packages, update `container.image` in `ci.yml` + this bullet in the same PR.
- **Package manager:** pnpm@10.33.0 (workspaces); Turborepo orchestration. `uuid` pinned to `^14` via root pnpm overrides (transitively from `webpack-dev-server → sockjs`; clears GHSA-w5hq-g745-h8pq).
- **Code style:** functional, avoid classes/singletons. No CSS-in-JS. No inline end-of-line comments.
- **Lint/format:** `oxlint` + `oxfmt`. Never `npx biome`.
- **Tests:** Vitest everywhere. Storybook Test (via `@storybook/addon-vitest`) for interaction tests in `apps/storybook`.
  - **Avoid jsdom unless it's necessary.** jsdom is honest for event handlers, `useEffect` lifecycle, and direct DOM manipulation — testing those there is fine. But jsdom doesn't implement the browser's keyboard (Tab / focus / arrow keys), pointer-down sequencing, layout, or scroll semantics; a unit test that fires synthetic events to assert on focus / pointer behaviour ends up testing the handler against the test author's model of the browser, not the browser itself. Write those as Storybook play functions instead — `apps/storybook`'s test runner uses Playwright under the hood, so the cost over jsdom in a hot loop is seconds, and the test exercises real browser semantics. The Playwright container is already pinned in CI, so play tests aren't extra infrastructure.
- **Test structure: flat.** Each `it` reads top-to-bottom without scrolling up.
  - **No nested `describe`.** One `describe` per file at most. Split files instead of nesting.
  - **No `beforeEach`** for cosmetic shared setup. Inline `setup()` helper per test.
  - **`beforeAll` is a perf escape hatch**, not a grouping tool. Acceptable only when shared setup is genuinely expensive (`loadProject` ~1s) and the alternative would meaningfully regress runtime. Annotate the reason inline.
  - Prose over jargon in test names.
- **Pre-commit checks (always, no exceptions):** before `git commit`, run
  ```
  pnpm -r format && pnpm turbo run format:check lint typecheck test
  ```
  Format-only changes to staged files land as noisy follow-up commits; CI fails on regressions. Scope with `--filter=<pkg>` if something's slow — don't skip.
- **Design tokens:** flat paths organised per DTCG `$type`, following [Terrazzo's style guide](https://terrazzo.app/docs/guides/styleguide/). Primitives and composites coexist under their type root — `color.palette.blue.500` alongside `color.surface.default`, `space.md` alongside `radius.sm`. No tier prefix in paths. Variation across `mode`, `brand`, `contrast` lives in resolver modifiers.
- **TypeScript:** strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` on.
- **READMEs:** terse human-register opening (one short sentence on what the package IS, then a sentence on how it fits the bigger picture). Detailed reference (API tables, config fields, block catalogues) lives on the docs site, not in the README. Each README links to the docs site prominently.

## Docs site structure

Three navbar pills: Guides / Reference / Developers. Reference sidebar groups three categories (Packages / Blocks / Model) so the index reads as an index, not a flat list. Integrations live under `guides/integrations/` (one index + one page per integration). No separate Concepts section — model pages live under `reference/`. Markdown links between docs **must include the `.mdx` extension** so Docusaurus rewrites them at build time; without the extension, the SPA router resolves them against the current page on click and 404s. Index pages with non-default IDs link as `./folder/index.mdx`, not `./folder/`.

## DTCG skill

`.claude/skills/dtcg-tokens/SKILL.md` — reference card for the DTCG 2025.10 spec. Loads automatically when working on token files; consult it before writing or editing `.tokens.json` / `.dtcg.json` content.

## Storybook addon gotchas

- **Manager bundle**: use `React.createElement` (or local `h` alias), **not JSX**. The manager runs React 18 and doesn't expose `react/jsx-runtime`'s React-19 dispatcher — JSX in manager code crashes with *"Cannot read properties of undefined (reading 'recentlyCreatedOwnerStacks')"*. Preview code is fine with JSX.
- **Register tools via element-returning function**: `render: () => h(ThemeToolbar)` — passing the component function directly invokes hooks outside React's render cycle.
- **Preview ↔ manager comms**: Storybook's channel (`addons.getChannel()` + `emit`/`on`). Manager can't import preview-side Vite virtual modules.
- **CSF Next addons**: default-export a factory that returns `definePreviewAddon(previewExports)` (from `storybook/internal/csf`). Consumers opt in via `definePreview({ addons: [swatchbookAddon()] })`.
- **MDX doc blocks can't use story hooks**: `useGlobals` / `useArgs` / `useChannel` / `useParameter` from `storybook/preview-api` require the preview HooksContext, which only exists while a story is rendering. From an MDX doc block they throw. Subscribe to `addons.getChannel()` directly and manage state with plain React hooks.

## Storybook MCP

`apps/storybook` runs an MCP server via `@storybook/addon-mcp` at `http://localhost:6006/mcp`. The endpoint only exists while Storybook is running.

```
# Terminal 1
pnpm dev           # = turbo run storybook
# Terminal 2
claude
```

## Releases

- **Versioning:** [Changesets](https://github.com/changesets/changesets). Six published packages — `core` / `addon` / `blocks` / `switcher` / `integrations` / `mcp` — grouped as `fixed`: same version, released together. Private workspaces (`tokens`, root, `apps/*`) are listed under `ignore`.
- **Pre-1.0 semver:** routine breaking changes take a `minor` bump. No `!` in PR titles. Each major is a deliberate stability commitment, not "this PR happens to break something."
- **Writing a changeset:** PRs with user-visible changes run `pnpm changeset` locally and commit the generated `.changeset/*.md`. Internal-only refactors can skip it. **Docs-only PRs add a `patch` changeset** so the snapshot script rebuilds the current minor's snapshot on release — without it, the docs fix only reaches `/next/`, not `/`.
- **Publishing flow:** Changesets' GitHub Action opens a "Version Packages" PR on `main` that consumes queued `.changeset/*.md` entries and bumps versions. Merging runs `pnpm release` → `changeset publish` via trusted publishing (GitHub OIDC → short-lived npm token; provenance attestation on). See `.github/workflows/release.yml`.
- **Docs versioning:** `scripts/snapshot-docs-version.mjs` snapshots `apps/docs/docs/` into `apps/docs/versioned_docs/version-<minor>/` and updates `versions.json` + `versioned_sidebars/`. Runs as part of the release. Turbo's `build` task includes the snapshot dirs in its input hash so the cache invalidates when a snapshot lands.

## Plan governance

- Plan body edits → same PR as the change they reflect.
- Tactical choices that don't change design intent → append to `docs/decisions.md`.
- PR template (`.github/pull_request_template.md`) requires `Milestone:`, `Closes:`, and `Plan impact:` lines.
- **`Closes #N` must be plain text, one per line.** GitHub's auto-close parser ignores `**Closes:** #N` (bold-wrapped) and `Closes: #N1, #N2` (comma-separated past the first). The template was the original source of the bolded form — it's been corrected; don't re-introduce it.
- Every PR links an existing GitHub issue. File one first if needed: `gh issue create --milestone "Maintenance" --title "…"`. Merging the PR auto-closes the issue.
- **PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)**: `<type>(<scope>): <description>`. Types: `feat` / `fix` / `chore` / `docs` / `test` / `ci` / `refactor` / `perf` / `build` / `revert`. Scope is a package slug (`core`, `addon`, `blocks`, `switcher`, `integrations`, `mcp`, `tokens`, `storybook`, `docs`, `ci`) or omitted. Milestone goes in the PR body, never the title. Verb-first lowercase subject (lowercase even for proper nouns).
- **Issue vs PR references in prose:** GitHub shares a numeric namespace; `#N` could be either. In prose (status updates, CLAUDE.md, commit bodies, chat), prefix with `issue` or `PR` — "issue #77", "PR #83". Inside PR bodies and issue comments the bare `#N` is fine because GitHub renders the linked page with a type header.
