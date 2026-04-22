# @unpunnyfuns/swatchbook-blocks

## 0.12.0

### Patch Changes

- 1cc3eee: fix(a11y): underline body-content links so colour isn't the sole distinguisher

  Axe flagged two related WCAG violations: **1.4.1 (Use of Color)** — links in body text weren't distinguishable without colour — and **1.4.11 (Non-text Contrast)** — the a11y=High-contrast amber primary (#fcd34d) only reached 1.31:1 against surrounding Dark-mode text (#f1f5f9), below the 3:1 non-text contrast minimum.

  Underlining body links addresses both: colour is no longer the sole distinguisher, and 1.4.11's ratio requirement only applies when colour is carrying the signal on its own.

  Rule scoped to `.markdown a` — Docusaurus's rendered-MDX container — so navbar, sidebar, footer, and button-style links are untouched. Those carry affordances via position and chrome instead of inline prose context.

## 0.11.6

### Patch Changes

- 4fd054c: docs: strip remaining pitch residue from the intro's "What the addon includes" section

  Follow-up to the prose conversion. A second read found eight smaller tells still reading as marketing framing: section heading ("gives you" → "includes"), action verbs ("brings in" → "includes"), tour-guide framing ("Most authoring happens in MDX"), a mid-prose `<ColorPalette filter="color.*" />` example that acted as a sales moment, an emphasised "A single Swatchbook icon" ("single" → dropped), a redundant gloss after the color-format selector's own name, and a three-parallel-clauses "nothing is written / no prebuild / HMR propagates" stack that worked as a strawman — consolidated to one descriptive clause. Section now reads as a reference entry.

- 3cff041: docs: rewrite the intro's "What the addon gives you" section as prose under subheadings

  Replaces the five **bold** — em-dash — sentence bullets with short subheaded paragraphs (Installation, No external compile step, Doc blocks, Toolbar, `useToken` hook). Also strips the editorial scaffolding — phrases like "Day-to-day authoring", "ready-made starting point", "without per-page wiring", "so typos surface at compile time rather than runtime" — that read as sales framing rather than description. The subsections now state what each feature is and where to read more, without pitching.

- 77c5f23: docs: prose sweep + adopt two orphaned concept pages into the sidebar

  **Prose sweep.** An audit across every live `.mdx` and each package README surfaced six clear pitch-language tells. Fixed five (kept two borderline "why axes, not themes" link-title italics as-is since they're page titles, not strawman setups):

  - Root README and intro both had "Drop them into MDX pages and your token reference writes itself" — replaced with descriptive version naming the per-type previews explicitly.
  - Addon reference: "those hooks just work wherever the addon is registered" → "the hooks resolve wherever the addon is registered".
  - Authoring guide: "the blocks just work inside MDX" → "the blocks render inside MDX".
  - Quickstart: "Takes ~5 minutes if you already have a Storybook project." → "Assumes an existing Storybook 10 project with the Vite builder. Install, register, author the first doc page."

  **Orphan adoption.** `concepts/axes-vs-themes` and `concepts/theme-reactivity` existed as pages and were linked from the intro, but weren't listed in the home sidebar's Concepts category. Clicking those links landed on pages with no sidebar highlighting or breadcrumb context. Added both to the Concepts category; `axes-vs-themes` goes first (foundational "why"), `theme-reactivity` goes between diagnostics and token-pipeline (implementation-facing after the concept tour).

## 0.11.5

### Patch Changes

- fbcbf6c: docs(tokens): match the switcher's axis order to the resolution order

  `resolutionOrder` controls which overlay wins when two touch the same token; the `modifiers` object's key order controls how the switcher UI enumerates the axes. The previous PR swapped resolutionOrder to `mode → typeface → a11y` but left modifiers in the old `mode → a11y → typeface` shape, so the switcher still rendered a11y before typeface.

  Swapping modifiers to match. Switcher now shows **mode → typeface → a11y**, which matches the conceptual flow: pick your base font, then opt in to the accessibility overlay on top.

## 0.11.4

### Patch Changes

- 58853c3: docs(tokens): a11y=High-contrast escalates base font through each typeface's accessibility slot

  Partial re-introduction of typography into a11y=High-contrast — but typeface-aware this time, so the axes stay conceptually separate in their overlay files while composing into different outcomes per tuple.

  Shape:

  - Every typeface context declares `font.family.base-accessible` alongside `font.family.base`. Mode-level Variable default: `base = system`, `base-accessible = comic`. Monotype overlay: `base = mono`, `base-accessible = comic-mono`.
  - `high-contrast.json` aliases `font.family.base = {font.family.base-accessible}` — doesn't mention any typeface name; resolves through whichever typeface slot is active.
  - `resolutionOrder` flipped to `[tokens, mode, typeface, a11y]` so a11y gets the last word after typeface has declared its accessibility slot.

  Outcomes per tuple:

  - typeface=Variable + a11y=Normal → system
  - typeface=Variable + a11y=High-contrast → Comic Sans (variable-width comic signal)
  - typeface=Monotype + a11y=Normal → monospace
  - typeface=Monotype + a11y=High-contrast → Comic Mono (comic-monospace signal)

  Same alias-indirection pattern as `color.accessible.primary.*` — just applied to font-family now.

## 0.11.3

### Patch Changes

- c50f0ab: docs(tokens): separate a11y from typeface in the docs-site fixture

  `high-contrast.json` used to also swap the base font family to `{font.family.comic}` — a leftover from when a11y carried a typography signal on top of its contrast role. Now that the `typeface` axis owns font-family independently (Variable vs Monotype), having a11y also touch it meant `typeface=Variable + a11y=High-contrast` reshuffled the font regardless of the reader's typeface pick.

  Drops the `font.family` block from the a11y overlay. a11y now owns **contrast only** — amber primary ramp via alias indirection, neutral shifts for muted text, plus the 108% base-size bump kept as a readability signal. Font family is entirely the typeface axis's domain: Variable ⇒ system, Monotype ⇒ comic-mono, regardless of a11y.

- c50f0ab: docs(tokens): rename `brand` axis to `typeface`, swap a11y primary to amber, route Monotype through a comic-monospace stack

  Three coordinated edits on the docs-site fixture that bring the axes' names in line with what they actually do and sharpen the accessibility signal:

  - **Axis rename.** `brand` was never a brand axis — it chose between a variable-width and a monospaced typeface. Renamed to `typeface` with contexts `Variable` / `Monotype`; the data-attribute selector becomes `[data-sb-typeface="…"]`. The storybook reference fixture's `brand` axis (an actual brand variation) is unchanged.
  - **A11y primary → amber.** `color.accessible.primary.*` in both mode files now aliases to a new `color.palette.amber.*` ramp instead of `color.palette.brand.*`. a11y=High-contrast gets yellow/burnt-orange links that read as high-visibility accessibility signal rather than brand voice — burnt-orange (amber.800) on white for Light + High-contrast, bright yellow (amber.300) on dark for Dark + High-contrast, both well above AAA contrast.
  - **Monotype = comic-monospace.** New `font.family.comic-mono` fontFamily stack that prefers playful free monospaces (Comic Mono, Fantasque Sans Mono, Comic Shanns Mono) then falls through to Comic Sans MS and the system monospace. The Monotype overlay uses this stack, so toggling typeface=Monotype now reads as slightly-unhinged teletype rather than plain code font.

  No bundled font files — readers with Comic Mono / Fantasque Sans Mono installed locally get the playful face, everyone else gets Comic Sans MS or the system monospace fallback.

## 0.11.2

### Patch Changes

- ad92a1a: docs: soften the intro's "What it's not" paragraph

  Dropped the "— that's a documentation affordance, not a production theming API." aside, which restated the scope twice and read as pushing readers away. Tweaked the production-theming redirect to frame `emitCss` as the same-shape output available to consumer apps, rather than a consolation path.

- b1102c8: docs(tokens): rename `brand` axis to `typeface`, swap a11y primary to amber, route Monotype through a comic-monospace stack

  Three coordinated edits on the docs-site fixture that bring the axes' names in line with what they actually do and sharpen the accessibility signal:

  - **Axis rename.** `brand` was never a brand axis — it chose between a variable-width and a monospaced typeface. Renamed to `typeface` with contexts `Variable` / `Monotype`; the data-attribute selector becomes `[data-sb-typeface="…"]`. The storybook reference fixture's `brand` axis (an actual brand variation) is unchanged.
  - **A11y primary → amber.** `color.accessible.primary.*` in both mode files now aliases to a new `color.palette.amber.*` ramp instead of `color.palette.brand.*`. a11y=High-contrast gets yellow/burnt-orange links that read as high-visibility accessibility signal rather than brand voice — burnt-orange (amber.800) on white for Light + High-contrast, bright yellow (amber.300) on dark for Dark + High-contrast, both well above AAA contrast.
  - **Monotype = comic-monospace.** New `font.family.comic-mono` fontFamily stack that prefers playful free monospaces (Comic Mono, Fantasque Sans Mono, Comic Shanns Mono) then falls through to Comic Sans MS and the system monospace. The Monotype overlay uses this stack, so toggling typeface=Monotype now reads as slightly-unhinged teletype rather than plain code font.

  No bundled font files — readers with Comic Mono / Fantasque Sans Mono installed locally get the playful face, everyone else gets Comic Sans MS or the system monospace fallback.

## 0.11.1

### Patch Changes

- b0ce33e: docs: surface the full package set across indexes

  Several places still listed the pre-v0.10 three-package story (core / addon / blocks) and omitted switcher + mcp:

  - Root `README.md` — added the `mcp` row to the package table.
  - `CONTRIBUTING.md` — expanded the "everything user-facing lives under…" list and the changeset rule to cover all five published packages.
  - `packages/switcher/README.md` — created from scratch; the package shipped without one. Covers install, usage, exported surface, and where it's consumed inside the repo.
  - `apps/docs/docs/intro.mdx` — added a short "For AI agents" section pointing at the MCP server, plus updated "How to read these docs" to include `mcp` in the Reference list and added the new Developers section.

- a294673: docs: restore `swatchbook-*` in each package README's title header

  Every package README was headed with a one-word title (`# Addon`, `# Blocks`, `# Core`, `# MCP`). On npm's package page that renders as a standalone word stripped of context — a reader who lands on the tarball's own page via a search, deep link, or alert sees "# Addon" and has to hunt for what it's an addon _of_. Restored the `swatchbook-*` prefix so each README's title matches its published package name and re-establishes context on first scroll.

## 0.11.0

### Patch Changes

- 4d6a946: docs(tokens): give the docs-site's high-contrast axis real contrast boost

  The a11y axis on the docs-site tokens used to only swap the base font to a comic display face and bump font size by 8%. Colors stayed identical — which undersold the accessibility signal and didn't meaningfully improve the site's contrast on either Light or Dark.

  Adds mode-aware contrast-boosted values via alias indirection: each mode file (`themes/light.json`, `themes/dark.json`) now carries a parallel `color.accessible.*` namespace with darker-on-light / brighter-on-dark variants of `text.muted` and the full primary ramp. `themes/high-contrast.json` aliases role tokens to that namespace, so the a11y overlay stays mode-agnostic at the file level while the resolved values remain mode-aware.

  Visible outcomes on a11y=High-contrast:

  - Light: `primary.default` from `brand.600` (contrast ~4.8:1 on white) to `brand.800` (~9.5:1); `text.muted` from `neutral.500` (~4.5:1) to `neutral.700` (~10:1).
  - Dark: `primary.default` from `brand.500` to `brand.300`; `text.muted` from `neutral.300` to `neutral.100`.

  No change to Normal-contrast Light or Dark — this is purely the a11y overlay gaining colour where before it only carried typography.

- 50e5d3a: docs: explain the no-external-compile-step property

  New "The token pipeline" concept page under Concepts, covering how tokens reach the blocks through the addon's Vite virtual module rather than a separate prebuild step. Includes how HMR works against the virtual module, why the module doesn't extend to production consumer apps (and what to use instead — `emitCss` from core), and the Terrazzo parser credit. Linked from a new bullet in the intro.

- 60a9c76: fix(docs): route latest release at `/` and main-branch at `/next/`

  The docusaurus site's versioning config had drifted — `lastVersion: 'current'` pinned the main-branch docs to `/`, which caused Docusaurus to flag the released 0.10 snapshot as "out of date" even though 0.10 is the currently-shipping version. Visitors landing on `/` were reading unreleased content by default.

  Now matches the intent described in CLAUDE.md: `/` serves the latest released snapshot (implicit `lastVersion` from the first entry in `versions.json`); main-branch docs move to `/next/` with an "unreleased documentation" banner. Visitors shipping against `@unpunnyfuns/swatchbook-*@0.10.2` land on docs that match their installed code.

  No content changes — this is a routing-config fix.

## 0.10.2

### Patch Changes

- 9aaad81: docs: add a "For developers" section to the docs site

  New top-level navbar entry alongside Blocks / Guides / Reference, with three pages aimed at people who want to work on swatchbook's code rather than consume it:

  - **For developers** — landing page, the repo map, pointers to typical work shapes.
  - **Architecture** — the one data structure everything revolves around (`Project`), plus the static build path and the dev/HMR path from token file to rendered block. Includes how the MCP server plugs in.
  - **Sharp corners** — the "someone will bleed on this" list: Storybook manager-bundle JSX trap, atomic-save watcher pattern, React rules-of-hooks regressions, etc.

  CONTRIBUTING.md on GitHub stays as the dev-setup source of truth; the docs-site section covers the how-does-it-work reference new contributors need for a mental model.

## 0.10.1

### Patch Changes

- 548b041: chore(blocks): drop misleading "storybook-addon" npm keyword

  `@unpunnyfuns/swatchbook-blocks` ships MDX doc blocks; the Storybook addon surface lives in the sibling `@unpunnyfuns/swatchbook-addon` package. Keeping the `storybook-addon` keyword here surfaced blocks in npm searches people really wanted the addon for.

- 9722153: docs(blocks): move hooks into a dedicated reference page; correct stale "not re-exported from addon" claims

  The addon has re-exported the full blocks surface (hooks, provider, contexts) since the one-stop-install work landed, so `import { useSwatchbookData } from '@unpunnyfuns/swatchbook-addon'` works the same as importing from blocks. The intro page and do/don't list still asserted the opposite; updated both. Hooks now have their own reference page under Blocks → Hooks.

- c1e6b98: fix(blocks): TokenNavigator hooks run before empty-state early return

  Typing a `root` or `type` arg that matches zero tokens used to cross a
  hook-order boundary — the `matchCount` `useMemo` sat after the
  `tree.length === 0` early return, so the first non-empty render threw
  "Rendered fewer hooks than expected". Hoisted the memo above the
  guard. Added a `NoMatches` story as a regression check.

## 0.10.0

## 0.9.0

## 0.8.0

### Minor Changes

- cd64451: feat: partial HMR for token edits — no more full preview reload

  Saving a token file in dev mode now re-renders the preview in place
  instead of blowing away the iframe. Toolbar state, story args, scroll
  position, and any open overlays survive the refresh.

  Under the hood:

  - The addon's Vite plugin now sends a custom HMR event
    (`swatchbook/tokens-updated`) carrying the fresh virtual-module
    payload when source files change, instead of firing a `full-reload`.
  - The preview subscribes via `import.meta.hot.on`, re-injects the
    generated stylesheet, and forwards the payload on Storybook's
    channel as `TOKENS_UPDATED_EVENT`.
  - A new `useTokenSnapshot()` hook in blocks mirrors the
    `channel-globals` pattern — subscribes to the channel via
    `useSyncExternalStore` and exposes a live snapshot that `useProject`
    reads from. Token edits propagate through React's normal
    re-render path; no block-specific wiring per consumer required.
  - Outside Storybook (the docs-site path, unit tests, production
    builds) the channel never fires and consumers keep seeing the
    initial values baked into the virtual module at build time — same
    behavior as before.

## 0.7.0

## 0.6.2

### Patch Changes

- 1971275: fix(blocks): honor the color-format selector in Shadow/Border/Gradient previews

  `<ShadowPreview>`, `<BorderPreview>`, and `<GradientPalette>` each shipped
  a local `formatColor` helper that ignored the toolbar's color-format
  selector — their sub-value text stayed in `colorSpace(components…)` or
  `rgb(%)` regardless of what the user picked. Now they route through the
  shared `formatColor` from `@unpunnyfuns/swatchbook-blocks`, subscribing
  to `useColorFormat()` the same way `<ColorPalette>` and
  `<CompositeBreakdown>` do.

  Flipping the toolbar between hex / rgb / hsl / oklch / raw now updates
  the breakdown labels in all three blocks.

- 97a32bb: fix(blocks): surface sub-value alias chains in `<CompositeBreakdown>`

  When a composite token (`border`, `shadow`, `transition`, `typography`,
  `gradient`) references another token by alias on one of its sub-values,
  the `<TokenDetail>` drawer now shows the full alias chain next to that
  row — the same way top-level token aliases are surfaced by
  `<AliasChain>`. Previously a border whose `color` aliased another color
  token rendered only the resolved hex, with no indication that the value
  had been authored as an alias.

  Chains walk transitively via Terrazzo's `partialAliasOf` + the target
  token's own `aliasChain`, so authors see the full `borderColorAlias →
colorRole → colorPrimitive` path.

- 1b5989c: fix(blocks): align detail-overlay close button with panel padding

  The slide-over close button was pinned at `top: 8px; right: 8px` — half
  the 16px panel padding — so it sat tucked against the corner instead of
  aligning with the content. Bumped both to `16px` so the button sits
  inside the visual inset, flush with the heading.

## 0.6.1

## 0.6.0

### Minor Changes

- 4aeb6ab: feat(blocks): runtime search on `<TokenTable>` and `<TokenNavigator>`

  Both blocks now render a search input at the top (default on) that narrows the visible tokens by case-insensitive substring. `<TokenTable>` filters rows by path, type, or value; `<TokenNavigator>` prunes the tree to matching leaves and auto-expands every group on the way to a match so hits are visible without clicking. Adds a `searchable?: boolean` prop to both; pass `false` to hide the input when you want authoring-time filtering (`filter` / `type` / `root`) only.

  Restores the runtime search UX the retired Design Tokens panel used to have, which the docs and Dashboard page have been (misleadingly) claiming ever since.

- 5ac3528: feat(blocks): `type` prop on `<TokenNavigator>`

  Scope the tree by DTCG `$type`. Pass a single string (`type="color"`) to restrict to one type, or an array (`type={['duration', 'cubicBezier', 'transition']}`) for a small-multiples view. Composes with `root` — both constraints must hold. Matches the `type` prop already available on `<TokenTable>`.

## 0.5.0

### Minor Changes

- d565fcd: feat: flat token paths, per DTCG `$type`

  Token paths organize by DTCG `$type` at the root. Color primitives live under `color.palette.<hue>.*` (e.g. `color.palette.blue.500`); semantic color roles sit at `color.<role>.*` (`color.surface.default`, `color.text.default`, `color.accent.bg`). Other types follow the same flat pattern: `size.100` alongside `space.md`, `duration.fast` alongside `transition.enter`, `font.family.sans` alongside `typography.body`. No `ref` / `sys` / `cmp` tier prefix.

  CSS emission follows the paths: `--<prefix>-color-palette-blue-500`, `--<prefix>-color-surface-default`, `--<prefix>-typography-body-font-family`. `DEFAULT_CHROME_MAP` in core points each chrome role at its flat-path target.

  The reference and starter fixtures demonstrate the shape: per-type `.json` files under `tokens/` (`color.json`, `size.json`, `typography.json`, …) plus resolver modifier overlays under `tokens/themes/`.

## 0.4.0

### Minor Changes

- 01fdcb0: feat(core): chrome config with hard-coded literal defaults

  Blocks now read ten chrome variables in a fixed `--swatchbook-*` namespace
  (`--swatchbook-surface-default`, `--swatchbook-accent-bg`, etc.),
  independent of the project's `cssVarPrefix`. Every chrome variable is
  always declared — by default to hard-coded light-mode literals in
  `DEFAULT_CHROME_MAP` (`#ffffff`, `#111827`, `system-ui, …`, etc.), so
  zero config still gives readable themed chrome.

  To wire chrome to your own tokens, supply a `chrome` map keyed by role
  name. Any role you set becomes a `var(--<prefix>-<your-token>)`
  reference that flips with your theme switches; the rest stay on the
  literal defaults:

  ```ts
  swatchbookAddon({
    config: {
      chrome: {
        surfaceDefault: "color.brand.bg.primary",
        textDefault: "color.brand.fg.primary",
        accentBg: "color.brand.accent.primary",
      },
    },
  });
  ```

  Composite sub-field targets (`'typography.sys.body.font-size'`) are
  accepted. Unknown roles and unresolved targets produce `warn`
  diagnostics (group `swatchbook/chrome`) and fall back to the literal
  default.

  The closed set of roles is exported as `CHROME_ROLES` with the
  `ChromeRole` type and the default map as `DEFAULT_CHROME_MAP`, all from
  `@unpunnyfuns/swatchbook-core`.

  **Breaking (blocks internals):** `chromeAliases()` and `CHROME_VARS` are
  removed from `@unpunnyfuns/swatchbook-blocks` — blocks no longer need to
  rewire the project prefix on every wrapper because chrome vars are a
  fixed namespace. Consumers only importing the public block components
  are unaffected.

## 0.3.0

### Minor Changes

- 8e89d8d: Add `<Diagnostics />` block. Renders the project's load diagnostics — parser errors, resolver warnings, disabled-axes validation issues, etc. — as a collapsible severity-colored list. Auto-opens when the project carries errors or warnings; stays collapsed for clean loads. Consumers compose it on their own MDX pages alongside `<TokenNavigator />` / `<TokenTable />` to replace what the Design Tokens panel used to show at the top of its tree.
- 3d2d4bd: **Breaking**: remove the addon's Design Tokens panel. Composing `<Diagnostics />` + `<TokenNavigator />` + `<TokenTable />` on an MDX page now serves the same role the panel played — see the [token-dashboard guide](https://unpunnyfuns.github.io/swatchbook/guides/token-dashboard). The `PANEL_ID` constant is removed from the public API; the `swatchbook/design-tokens` panel tab is no longer registered. Channel events and everything outside the panel itself are unchanged.
- 3fb0acf: Two behavioural changes to the list-style blocks (`TokenTable`, `ColorPalette`, `TokenNavigator`-adjacent, `TypographyScale`, `DimensionScale`, `FontWeightScale`, `GradientPalette`, `StrokeStyleSample`, `FontFamilySample`, `BorderPreview`, `ShadowPreview`):

  - **Fix empty renders for typed-but-differently-pathed tokens.** Every block defaulted its `filter` prop to its `$type` name (`filter = 'fontFamily'`, `filter = 'dimension'`, etc.), which treated the type name as a **path** glob. Projects whose token paths don't coincidentally start with the type name (e.g. `font.ref.weight.*` for `fontWeight`) rendered as empty. Defaults removed — the `$type` check inside each block already scopes correctly, `filter` is purely additive for narrowing.
  - **Add `sortBy` / `sortDir` props.** `sortBy: 'path' | 'value' | 'none'` (default `'path'`, except `DimensionScale` and `FontWeightScale` which default to `'value'` to preserve their pixel/weight-ordered layout). `sortDir: 'asc' | 'desc'`. `'value'` ordering uses numeric magnitude for `dimension` / `duration` / `fontWeight`, perceptual oklch L → C → H for `color`, lexicographic for `fontFamily` / `strokeStyle`, and falls through to path for composites where a one-dimensional "value" isn't meaningful.

- e6dd438: **Breaking**: `<TokenTable />` redesign — compact two-column layout (`Path | Value`) with a click-to-open `<TokenDetail>` slide-over. The row's value cell renders the type pill + color swatch + formatted value inline. The `showVar` prop is removed; the CSS var is one click away in the drawer. Table layout is now `auto` (no fixed percentage widths) with per-column `min-width` floors so columns follow content and stop collapsing on narrow containers. Consumers who want to own the follow-up UI can pass `onSelect(path)` to suppress the built-in drawer. The `<TokenNavigator />` drawer is unchanged in behavior but now shares the same overlay component internally (no visible difference).

### Patch Changes

- a82552f: Fix blocks inheriting Storybook MDX docs element styling. Every block's outer wrapper now carries a `data-swatchbook-block` marker, and the blocks package mounts a scoped stylesheet (`[data-swatchbook-block] table, ul, li, details, summary, … { all: revert-layer }`) that neutralizes `.sbdocs` element styles bleeding into the chrome. Consumers no longer need to wrap blocks in `<Unstyled>` on MDX docs pages — blocks look the same in stories and in docs.
- a2b5fcc: Unify block chrome: text colors, surface backgrounds, and border weights now come from named constants in `internal/styles` (`TEXT_MUTED`, `TEXT_DEFAULT`, `SURFACE_DEFAULT`, `SURFACE_MUTED`, `SURFACE_RAISED`, `BORDER_DEFAULT`, `BORDER_STRONG`, `BORDER_FAINT`) instead of inline `var(--sb-*)` strings repeated across 15+ files. Empty-state divs are replaced by a shared `EmptyState` component. No visual change for valid configs; fallback alphas now match across blocks.
- c6aab6d: Fix value display across every block: TokenTable, TokenDetail, TokenNavigator, AxisVariance, CompositeBreakdown, DimensionScale, StrokeStyleSample now route one-line value strings through a single `formatTokenValue` helper that honors the active color-format dropdown for color tokens and known composites (border, shadow, gradient). Typography / transition / cubicBezier / dimension / fontFamily get dedicated stringifications instead of raw JSON dumps; only truly-foreign shapes fall through to truncated JSON now.

## 0.2.2

### Patch Changes

- 9a775be: Tighten the addon's HMR watch-path matching. File-path matches now require a path-separator boundary (`/project/resolver.json` no longer also matches `/project/resolver.json.backup`), and `picomatch.scan` replaces the hand-rolled glob-to-dir regex — brace-expansion patterns (`tokens/{base,overlays}/**/*.json`) and nested globstars now derive the correct watch root.
- cdf37dc: Fix `ColorPalette` success-state wrapper missing the `chromeAliases` spread that PR #324 added elsewhere. The empty-state wrapper got the alias layer; the main grid wrapper didn't, so consumers on any `cssVarPrefix` other than `sb` saw fallback colors for border / text chrome on the populated ColorPalette block. One-line fix — all other blocks were already correct.
- 416d5b7: Surface two previously-silent misconfiguration cases as `warn` diagnostics:

  - `swatchbook/resolver` — resolver modifier with no `default` and no contexts. Previously collapsed to an axis with an empty-string `default` and propagated into theme names; now users see "Resolver modifier X has no default and no contexts — axis is unusable" in the Design Tokens panel.
  - `swatchbook/project` — `config.disabledAxes` filtered out every theme. Previously rendered an empty tree with no hint; now the diagnostic names the pinned axes and suggests checking that their default contexts appear in the resolver's permutations.

  Both are diagnostics, not errors — the project still loads. No behavior change for valid configs.

## 0.2.1

### Patch Changes

- e86d414: Fix block chrome rendering when `cssVarPrefix` is anything other than `sb`. Blocks were referencing their own chrome (surface, borders, text, accent) via literal `var(--sb-color-sys-*)`, which fell through to fallback values for every project on the post-0.2.0 default prefix (`swatch`) or any custom prefix. Each block wrapper now spreads a CSS custom-property alias layer redirecting the `--sb-*` names to the project's actual prefix; chrome renders correctly regardless of prefix.

## 0.2.0

### Minor Changes

- 2f733b5: **BREAKING:** Prefix `data-*` attributes with `cssVarPrefix`. `emitCss` now emits `[data-<prefix>-mode="Dark"][data-<prefix>-brand="Brand A"]` instead of `[data-mode="Dark"][data-brand="Brand A"]`, and the addon's preview decorator writes the matching prefixed attrs on `<html>`. Default prefix becomes `swatch` (applied in `loadProject` when config omits one); set `cssVarPrefix: ''` to keep the bare `data-<axis>` form. Fixes collisions with third-party libs that claim generic `data-mode` / `data-theme` (Tailwind, many theme-switcher plugins).

  Also adds `dataAttr(prefix, key)` export from `@unpunnyfuns/swatchbook-core` so consumer code setting these attrs manually stays in lockstep.

  Docs reframed to clarify that swatchbook is a **DTCG token documentation tool**, not a runtime theme-switcher or CSS-variable framework. The toolbar's axis switching is a documentation affordance for inspecting tokens across every context; the emitted CSS + attrs are internal scaffolding, not a production theming API.

## 0.1.5

### Patch Changes

- d5f2a03: Move `format-color.ts` out of `src/internal/` to `src/format-color.ts`. It's part of the public API (documented on the docs site, paired with `useColorFormat()`), so living in `internal/` was confusing to anyone reading the source. No consumer-visible API change — the `formatColor` / `COLOR_FORMATS` / `ColorFormat` / `FormatColorResult` / `NormalizedColor` exports from `@unpunnyfuns/swatchbook-blocks` are unchanged.
- 89d48a1: Declare `"sideEffects": false` on all three published packages. No CSS imports, no module-level work that isn't gated behind used-export reachability. Gives consumer bundlers permission to tree-shake unused exports more aggressively.

## 0.1.4

### Patch Changes

- be1ee1f: Tidy npm keywords: drop `storybook-addon` from `@unpunnyfuns/swatchbook-blocks` (it's a companion doc-block library, not an addon), and add broader discovery terms `design` and `style` to `@unpunnyfuns/swatchbook-addon`.

## 0.1.3

### Patch Changes

- 34e6255: Fix the toolbar's color-format switcher (hex / rgb / hsl / oklch / raw) having no effect on blocks rendered in MDX docs pages. `useColorFormat()` was context-only, and the addon's preview decorator — which populates the context — doesn't run on bare MDX pages. Subscribe to `globalsUpdated` / `updateGlobals` / `setGlobals` as a fallback when no provider is mounted, mirroring `useProject()`'s existing pattern.
- 04c9c2f: Fix MDX-rendered blocks flickering back to default values one frame after an axis or color-format change. Storybook force-rerenders the docs container on every `updateGlobals`, which remounts the MDX-embedded blocks and reset their local `useState` trackers. Lift the channel-derived globals (axes / theme / color format) to a module-level store consumed via `useSyncExternalStore` so the values survive remounts, and drop the `setGlobals` listener that could overwrite a just-toggled value with the pre-toggle snapshot in edge orderings.
- 5dd94fe: Fix MDX blocks rendering defaults for one frame when the toolbar's URL-persisted selection is non-default. Storybook stores toolbar state in `?globals=…`, so deeplinking or reloading with e.g. `swatchbookColorFormat:rgb` already has `rgb` in the preview's `userGlobals`, but `SET_GLOBALS` — the event that carries it on init — fired before our listener subscribed. Subscribe at module load and re-add the `setGlobals` handler so first render matches the persisted selection.

## 0.1.2

### Patch Changes

- e298dc3: Fix axis switching on MDX docs pages. The addon's preview decorator wrote `data-<axis>` attributes to `<html>` from inside the story wrapper — so bare MDX pages (no `<Story />`) had no ancestor carrying the tuple, the per-tuple CSS selectors never matched, and colors stayed on `:root` defaults no matter what the toolbar did. Subscribe to the channel at module level and write the same attrs independent of any decorator run, and pick up `setGlobals` in the blocks' fallback so the "Active tuple" indicator reflects the current selection on first render.

## 0.1.1

## 0.1.0

### Minor Changes

- 943fda9: Add a color-format switcher across `TokenTable`, `TokenDetail`, and `ColorPalette`. A new `swatchbookColorFormat` global (default `hex`) and a matching toolbar dropdown route every color value through `formatColor()` — `hex`, `rgb`, `hsl`, `oklch`, or `raw` JSON. Out-of-gamut or wide-gamut colors fall back to `rgb()` for the `hex` format and are marked with a ⚠ indicator. Display only — emitted CSS is unaffected.
- 3741dc7: `ColorPalette`'s `groupBy` prop is now optional. When omitted, grouping is derived from the filter: one level below the filter's fixed prefix, clamped so every swatch keeps a leaf label. `<ColorPalette filter='color.sys.*' />` groups at `color.sys.<family>` automatically; `<ColorPalette filter='color.ref.blue.*' />` collapses the whole ramp into one group with each shade as a leaf. Pass `groupBy` explicitly when you want something the heuristic wouldn't pick.
- c593297: `TokenDetail` grows two new visuals.

  - **Color swatch** — opening a `color` token now shows a two-surface swatch (the token on a light and dark backdrop) in the composite preview area, alongside the existing inline swatch next to the resolved value line. Lets viewers gut-check contrast without leaving the detail pane.
  - **Composite sub-value breakdown** — `typography`, `shadow`, `border`, `transition`, and `gradient` tokens now render a labelled field list underneath the composite preview. Shadow breakdowns group multi-layer tokens with a "Layer N" header; gradient breakdowns list each stop by position percentage.

- 7a631dc: Add `<ConsumerOutput>` subcomponent to `<TokenDetail>` — two copyable rows surfacing the token dot-path and its CSS variable reference (e.g. `var(--sb-color-sys-accent-bg)`). An "Active tuple: …" indicator shows which axis context the rendered values reflect.
- dfb5ec6: Add `DimensionScale` block: renders dimension tokens (`space.*`, `radius.*`, `size.*`, or any `$type: 'dimension'`) as visible bars sized to the token's actual value. Three visualization kinds — `'length'` (horizontal bar, default), `'radius'` (sample square with the token applied as `border-radius`), `'size'` (square box sized to the token). Bars wider than 480px are capped with a visible marker so extreme tokens don't break the layout. Sorted ascending by computed pixel value; ties broken by path.
- 0cb84fd: Drop the explicit-layers theming input. The DTCG 2025.10 resolver is now the sole theming input — `Config.themes`, the `ThemeConfig` type, and `resolveThemingMode` are all gone. Consumers with a layered config must move to a `resolver.json`.

  Theme names come from the resolver's modifier contexts: single-axis resolvers use the modifier value directly (context `Light` → theme name `Light`), multi-axis resolvers keep Terrazzo's JSON-encoded permutation ID. Pick sensible modifier context names in your resolver; what you write is what consumers see.

  The `themingMode` field on the virtual module is also removed — there's only one mode to be in.

- 6c7bfe5: Drop Tokens Studio `$themes` manifest support. The DTCG 2025.10 resolver is now the spec-native theming input; consumers using a manifest should convert to a `resolver.json` (the transformation is mechanical). `Config.manifest` is removed, `resolveThemingMode` returns `'layered' | 'resolver'`, and `themingMode` on the virtual module narrows accordingly. `@unpunnyfuns/swatchbook-tokens-reference` no longer exports `manifestPath`.
- bdcc784: Extract per-token sample primitives from `MotionPreview`, `ShadowPreview`, `BorderPreview`, and `DimensionScale`. Each preview block's single-token renderer is now exported standalone so MDX authors can embed just one sample: `MotionSample`, `ShadowSample`, `BorderSample`, and `DimensionBar` — each takes a `path: string` prop (and `DimensionBar` also accepts `kind`, `MotionSample` accepts `speed` / `runKey`). The parent blocks are unchanged in DOM output and props; they're now thin iterators that filter, sort, and map over the extracted sample.
- 9b5ecdc: Two new blocks surface standalone font primitives that were previously visible only inside `typography` composites:

  - `FontFamilySample` renders one row per `fontFamily` token with sample text in that family, plus the full font stack as metadata.
  - `FontWeightScale` renders one row per `fontWeight` token with sample text at that weight, sorted ascending by numeric weight so the scale is visually legible.

  `TokenDetail`'s `CompositePreview` gains matching branches so opening a `font.ref.family.sans` or `font.ref.weight.bold` token in isolation _looks like_ the font / weight rather than falling back to a JSON blob or bare integer.

- e091420: Add `<GradientPalette filter? />` block for DTCG `gradient` tokens, and a `gradient` branch on `TokenDetail`'s composite preview. Samples default to `linear-gradient(to right, …)` since DTCG gradients are stop arrays and the gradient function is a rendering choice consumers make at use-site — if you need radial / conic previews, reach for a custom block.

  This closes the last spec-level `$type` gap the reference fixture was missing; Terrazzo-extension types (`boolean`, `string`, `link`) remain intentionally out of scope per `docs/type-coverage.md`.

- 48bf3e5: **Breaking.** `SwatchbookProvider`, `SwatchbookContext`, `ThemeContext`, `AxesContext`, `useSwatchbookData`, `useOptionalSwatchbookData`, `useActiveTheme`, `useActiveAxes`, and the `Virtual*Shape` / `ProjectSnapshot` types now live exclusively in `@unpunnyfuns/swatchbook-blocks`. They are no longer exported from `@unpunnyfuns/swatchbook-addon` — import them from `@unpunnyfuns/swatchbook-blocks` directly. Workspace dep graph runs addon → blocks, which is the direction it was always meant to. Closes issue #202.
- 78ef794: Add `MotionPreview` block. Renders motion tokens — `transition` composites, standalone `duration`, standalone `cubicBezier` — as a looping ball animation so timing and easing are legible in motion. Per-row spec strip shows duration + easing; a global speed control (0.25× / 0.5× / 1× / 2×) lets consumers slow fast transitions to inspect the curve. Respects `prefers-reduced-motion: reduce` — the animation is replaced by an inline "Animation suppressed" notice and the replay button disables.
- c1a8c71: Expose modifier axes as first-class on `Project`. `Project.axes: Axis[]` surfaces each DTCG resolver modifier with its `contexts`, `default`, `description`, and `source` (`'resolver' | 'synthetic'`); projects loaded without a resolver get a single synthetic `theme` axis. A new `permutationID(input)` utility centralizes the tuple-to-string logic previously inlined in the resolver loader — single-axis tuples stringify to the context value; multi-axis tuples join with `·`. The virtual `virtual:swatchbook/tokens` module now also exports `axes`, so toolbar and panel work in follow-up PRs can key on tuples rather than flat theme names.
- 4737535: Add `ShadowPreview` and `BorderPreview` blocks. Each renders its composite tokens by applying them to a sample element, so the visual effect is legible — not just the sub-value string. Sub-values (offset, blur, spread, color for shadows; width, style, color for borders) appear next to the sample as a breakdown. `ShadowPreview` handles layered shadows (DTCG shadow values can be arrays) with a per-layer breakdown.
- 1434e4e: Split `TokenDetail` into composable subcomponents. Each section — `TokenHeader`, `CompositePreview`, `CompositeBreakdown`, `AliasChain`, `AliasedBy`, `AxisVariance`, `TokenUsageSnippet` — is now exported as a standalone block so MDX authors can embed just the piece they need (each takes the same `path: string` prop). `TokenDetail` itself is unchanged in DOM output and props; it's now a thin composition of these pieces.
- 28b2473: New `StrokeStyleSample` block renders DTCG `strokeStyle` tokens — string-form values (`solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `outset`, `inset`) display as a visible horizontal line at the computed `border-top-style`; object-form values (`{ dashArray, lineCap }`) render a textual fallback because CSS `border-style` has no matching primitive. Companion additions to the reference fixture exercise both forms plus a `number` group (opacities + line-height multipliers) so the full DTCG primitive surface is now covered.
- 92d5ae6: Introduce `SwatchbookProvider` + `useSwatchbookData` + `ProjectSnapshot` for framework-free block rendering. Blocks no longer depend on the addon's `virtual:swatchbook/tokens` module when a provider is in the tree, which means they render in plain React apps, unit tests, and non-Storybook doc sites — just hand the provider a `ProjectSnapshot`. The addon's preview decorator now mounts the provider around every story automatically, so Storybook-side authors see no change. The virtual-module fallback stays in place during the transition.
- 4a986d8: `TokenDetail` now renders an "Aliased by" tree mirroring the existing "Alias chain". For any token, it walks Terrazzo's `aliasedBy` field backward — direct consumers, their consumers, and so on — so a viewer can trace from a primitive (e.g. `color.ref.neutral.0`) to every sys and cmp token that ultimately depends on it. Each level is sorted ref → sys → cmp → other, then alphabetical. Depth is capped at 6 hops with a visible "truncated" note when hit. Only renders when the focal token has at least one direct consumer; otherwise the section is hidden.

  No new analysis — Terrazzo already produces `aliasedBy` during resolve. The section just surfaces it.

- 2f5bb68: `TokenDetail` now renders live previews for composite token types in its Resolved-value section. Typography tokens get a pangram sample styled via the emitted sub-vars (font-family / font-size / font-weight / line-height / letter-spacing); shadow and border tokens get a sample card with the effect applied; transition tokens get an animated ball using the composite's duration + easing. Color tokens keep their swatch. The preview sits above the formatted value text — one read gives you "what it looks like" and "what its sub-values are" together.

  Reduced-motion compliance: transition previews swap to an inline "Animation suppressed" notice when `prefers-reduced-motion: reduce` is set. `usePrefersReducedMotion` lifted to `internal/prefers-reduced-motion.ts` so it's shared with `MotionPreview`.

- 0ec7ff3: `TokenDetail` now renders visual previews for `dimension`, `duration`, and `cubicBezier` primitives — closing the consistency gap where these types had dedicated blocks (`DimensionScale`, `MotionPreview`) but fell back to raw text when opened individually. Dimension tokens show a bar sized to the token value; duration tokens animate a ball at that duration with neutral easing; cubicBezier tokens animate a ball at a fixed duration applying the easing curve. Both animated variants honor `prefers-reduced-motion: reduce` via the existing suppressed-notice path.
- 881038e: Add `TokenNavigator` block: expandable tree view of the token graph keyed on dot-path segments. Complements the flat `TokenTable` and the typed `ColorPalette` with an explorable hierarchy. Interior groups show child counts; leaves show a `$type` pill plus an inline preview (reuses `DimensionBar` / `ShadowSample` / `BorderSample` / `MotionSample` / `formatColor` for per-type visuals). Props: `root?` to mount at a subtree, `initiallyExpanded?` for default open-depth (default `1`), and `onSelect?(path)` for custom click handling — when omitted, clicking a leaf opens an inline slide-over with `<TokenDetail>` and a close button. Keyboard: Enter/Space toggles groups and activates leaves.
- b29dd7c: Tokens panel and `TokenDetail` block are now axis-tuple aware. The panel reads the active tuple from `globals.swatchbookAxes` (falling back to `swatchbookTheme` for back-compat) and shows a compact per-axis indicator above the token list. `TokenDetail` replaces its flat per-theme values table with an axis-aware view: tokens that are constant across every tuple collapse to one row; tokens that vary along a single axis render a compact 1-axis table (one row per context); tokens that vary along two or more axes render a matrix of the two most-varying axes, with further axes collapsed to the active selection. The `useProject()` hook now returns `activeAxes` + `axes` alongside `activeTheme` and subscribes to both `swatchbookAxes` and `swatchbookTheme` updates, keeping every block reactive to axis changes.

### Patch Changes

- 4ca9bb3: Align `storybook` peerDependency range on `@unpunnyfuns/swatchbook-addon` with `@unpunnyfuns/swatchbook-blocks` (`^10.3.5`). Consumers pinning Storybook to 10.3.0–10.3.4 previously satisfied the addon floor but failed the blocks floor.
- 954c26b: Extract the `wrapper` / `caption` / `empty` inline styles (plus the monospace stack and default border strings) shared across block components into `#/internal/styles.ts`. Pure refactor — no visible rendering change; each block's remaining `const styles = { ... }` now references the shared constants instead of re-declaring them.
- f5ccc4d: Sort token paths numerically so `color.ref.blue.50` comes before `color.ref.blue.100` instead of after. All block sorts now use `localeCompare(..., { numeric: true })`. Also corrected the `ColorPalette` `RefBlue` story's `groupBy` from `4` to `3` so every ramp shade groups under `color.ref.blue` instead of one swatch per row.
- 1986a0f: Add standard npm publish metadata — `license` (MIT), `repository`, `homepage`, `bugs`, `author`, `keywords` — to all three published packages. No runtime change; required for registry discoverability, npm provenance attestation, and legal clarity ahead of the v0.1.0 release.
