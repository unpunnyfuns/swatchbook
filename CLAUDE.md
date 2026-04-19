# Swatchbook — Claude orientation

Storybook addon + doc blocks for DTCG design tokens. Monorepo under `@unpunnyfuns`.

## Current milestone

`Current: prepping v0.1.0 release` — remaining work tracked in the **Release** milestone: publish workflow in CI with npm token + provenance (issue #41), then cut v0.1.0 with tag + release notes (issue #42). Feature work feeding into the release has already landed: full DTCG type parity with Terrazzo, consolidated toolbar (PR #213) and Design Tokens panel (PR #218), toolbar polish (PR #221), `disabledAxes` config surface (PR #206), `SwatchbookProvider` for framework-free rendering (PR #201), `TokenNavigator` block (PR #210), consumer-output panel (PR #209), color value format switcher (PR #208). Documentation site live at https://unpunnyfuns.github.io/swatchbook/.

Update this line when a milestone closes. See the matching GitHub milestones for per-issue state.

### Milestone taxonomy

GitHub milestones are scope buckets, not a sequence. Originally prefixed `M0`–`M13` when the work was ordered around a v0.1.0 release; prefixes were dropped during the feature push and re-focused now that we're cutting v0.1.0.

Two active tracks:

- **Feature milestones** — named scope areas (*Foundation*, *Core*, *Doc blocks*, *DTCG comprehension visualizations*, *Multi-axis theming UX*, …). Pick one to be "current" when we're pushing on features; the line above names what's active. No implied ordering across them.
- **Maintenance** — hygiene, refactors, CI polish, deferred cleanups. Drained opportunistically; never blocks a feature milestone.
- **Release** — Changesets versioning, publish workflow, cutting tags. **Active** for v0.1.0 — see the "Current milestone" line.

When filing an issue: feature work → the relevant scope milestone. Repo hygiene → *Maintenance*. Release plumbing → the *Release* milestone.

## Project conventions

- **Latest deps policy:** always pin the latest stable major/minor of every third-party dependency unless there's a concrete blocker. When adding a dep, check `npm view <pkg> version` and use that. Default to eager upgrades — we'd rather hit new-version friction early than accumulate a drift debt.
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
  import tokens     from '#/tokens/sys/color.json';  // ✅
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
  - Prose over jargon in test names: `` it('resolves alias chains (sys → ref)') `` beats `` it('resolves') `` inside nested describes.
- **Pre-commit checks (always, no exceptions):** before running `git commit`, run
  ```
  pnpm -r format && pnpm turbo run lint typecheck test
  ```
  Format changes to already-staged files land as noisy follow-up commits; CI fails on lint/typecheck/test regressions. Running all four locally catches every class before the push. If something is too slow, scope with `--filter=<pkg>` — don't skip.
- **Design tokens:** ref → sys only. Variation lives in modes on sys (i.e., resolver modifiers like `mode`, `brand`, `contrast`), which already handle the component specialization a `cmp` layer would attempt. Component-layer tokens are an explicit anti-pattern here — they double the token count for every axis without expressive gain; components alias `sys` directly.
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

- **Versioning:** [Changesets](https://github.com/changesets/changesets). Config in `.changeset/config.json`. The three published packages — `@unpunnyfuns/swatchbook-core`, `@unpunnyfuns/swatchbook-addon`, `@unpunnyfuns/swatchbook-blocks` — are grouped as `fixed`: they always carry the same version and release together. Private workspaces (root, `apps/storybook`, `tokens-reference`) and the iceboxed `tokens-starter` are listed under `ignore` so they never appear in bump prompts or get published.
- **Writing a changeset:** any PR with a user-visible change to the fixed-group packages runs `pnpm changeset` locally, picks the bump type (`patch` / `minor` / `major`), and commits the generated `.changeset/*.md` alongside the change. Purely internal refactors and doc-only PRs can skip it.
- **Publishing flow:** on `main`, Changesets' GitHub Action opens a "Version Packages" PR that consumes queued `.changeset/*.md` entries, bumps `package.json` versions, and regenerates `CHANGELOG.md`. Merging that PR runs `pnpm release` (builds + `changeset publish`) which pushes tags to GitHub and publishes to npm. See `.github/workflows/release.yml` (lands under the Release milestone via issue #41).

## Plan governance

- PR template (`.github/pull_request_template.md`) requires `Milestone:`, `Closes:`, and `Plan impact:` lines — don't remove them.
- Every PR links an existing GitHub issue. File one first if needed: `gh issue create --milestone "Mx — …" --title "…"`. Merging the PR auto-closes the issue; milestones close automatically when the last issue is done.
- **PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)**: `<type>(<scope>): <description>`. Types: `feat` / `fix` / `chore` / `docs` / `test` / `ci` / `refactor` / `perf` / `build` / `revert`. Scope is a package slug (`core`, `addon`, `blocks`, `tokens-reference`, `tokens-starter`, `storybook`, `ci`) or omitted. Milestone goes in the PR body, never the title — squash-merge lands the title on `main`.
- **Issue vs PR references in prose:** GitHub shares a numeric namespace between issues and pull requests, and both render as `#N`. When referencing either in prose (status updates, CLAUDE.md, commit bodies, chat), **prefix with `issue` or `PR` — e.g. "issue #77", "PR #83"**. Inside PR bodies and issue comments the bare `#N` is fine because GitHub renders the linked page with an unmistakable type header; prose lacks that cue and ambiguity stings when you go looking weeks later.
