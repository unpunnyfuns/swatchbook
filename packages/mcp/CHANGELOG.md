# @unpunnyfuns/swatchbook-mcp

## 0.19.1

### Patch Changes

- Updated dependencies [3b1ff9e]
  - @unpunnyfuns/swatchbook-core@0.19.1

## 0.19.0

### Patch Changes

- Updated dependencies [ba41ead]
- Updated dependencies [785486c]
- Updated dependencies [9fde68e]
- Updated dependencies [91c9901]
- Updated dependencies [40f3a68]
- Updated dependencies [ca1e52a]
- Updated dependencies [785486c]
  - @unpunnyfuns/swatchbook-core@0.19.0

## 0.18.0

### Patch Changes

- Updated dependencies [9496c82]
- Updated dependencies [44483af]
  - @unpunnyfuns/swatchbook-core@0.18.0

## 0.17.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.17.0

## 0.16.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.16.0

## 0.15.0

### Minor Changes

- e702b29: Fuzzy search across `TokenNavigator`, `TokenTable`, and the MCP `search_tokens` tool. Case-insensitive, tolerates a single-character typo per term, and accepts out-of-order terms — `"blue palette"` matches `color.palette.blue.500`, `"surf def"` matches `color.surface.default`. Replaces the previous case-insensitive substring match.

  Core now exports `fuzzyFilter(items, query, key, options?)` and `fuzzyMatches(haystack, query)` so downstream integrations can reuse the same ranking primitive. Backed by [`@leeoniya/ufuzzy`](https://github.com/leeoniya/uFuzzy).

### Patch Changes

- Updated dependencies [e702b29]
  - @unpunnyfuns/swatchbook-core@0.15.0

## 0.14.1

### Patch Changes

- Updated dependencies [b5976cd]
  - @unpunnyfuns/swatchbook-core@0.14.1

## 0.14.0

### Patch Changes

- Updated dependencies [171c9aa]
  - @unpunnyfuns/swatchbook-core@0.14.0

## 0.13.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.13.1

## 0.13.0

### Minor Changes

- 018f518: Add `get_axis_variance` MCP tool + extract the variance algorithm into `@unpunnyfuns/swatchbook-core` (`analyzeAxisVariance`). The algorithm now lives in one place and drives both the `AxisVariance` doc block and the new MCP tool, which classifies a token's axis dependence (`constant` / `single` / `multi`) and returns the per-axis breakdown of values seen in each context.

### Patch Changes

- Updated dependencies [018f518]
- Updated dependencies [f03161f]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0

## 0.12.0

### Minor Changes

- 197b856: feat(mcp): `get_color_contrast` tool for pair-wise contrast queries

  New tool that computes the contrast between two color tokens against a given theme. Two algorithms:

  - **`wcag21`** (default) — classic 1–21 ratio plus boolean pass flags for WCAG 2.1 AA (normal + large text) and AAA (normal + large text).
  - **`apca`** — signed Lc value (polarity-preserving; negative = dark foreground on light background, positive = light on dark) plus body / large-text / non-text pass flags against the Silver-draft bronze thresholds (`|Lc| ≥ 75 / 60 / 45`).

  Closes the loop on the accessibility work — the same computation axe runs against rendered HTML becomes queryable from an agent _about the tokens themselves_, per-theme. Useful for reasoning about link legibility, focus-ring visibility, border contrast, muted-text readability, without having to re-implement luminance math in the agent or pick between three competing algorithms.

  Built on `colorjs.io`'s contrast primitives, which the MCP package already depended on for `get_color_formats`. No new dependencies.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.12.0

## 0.11.6

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.6

## 0.11.5

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.5

## 0.11.4

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.4

## 0.11.3

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.3

## 0.11.2

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.2

## 0.11.1

### Patch Changes

- a294673: docs: restore `swatchbook-*` in each package README's title header

  Every package README was headed with a one-word title (`# Addon`, `# Blocks`, `# Core`, `# MCP`). On npm's package page that renders as a standalone word stripped of context — a reader who lands on the tarball's own page via a search, deep link, or alert sees "# Addon" and has to hunt for what it's an addon _of_. Restored the `swatchbook-*` prefix so each README's title matches its published package name and re-establishes context on first scroll.

- Updated dependencies [a294673]
  - @unpunnyfuns/swatchbook-core@0.11.1

## 0.11.0

### Minor Changes

- da22d9e: feat(switcher, mcp): first npm publish

  Earlier releases listed these packages in the repo and docs, but they never reached the npm registry — `npm install @unpunnyfuns/swatchbook-switcher` and `npm install @unpunnyfuns/swatchbook-mcp` both 404'd because trusted publishing was configured for `core` / `addon` / `blocks` only, and the partial-publish failure caused `changesets/action` to skip the subsequent tag push too (which is why git tags stopped at 0.6.2).

  Bootstrapped via npm's pending-trusted-publisher flow on both package names. Subsequent releases publish alongside `core` / `addon` / `blocks` via the standard OIDC path, and the tag / GitHub-release step runs normally.

  This changeset also tips the fixed-version group to 0.11.0 — the arrival of these two packages on the registry is the right anchor for a minor bump.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.0

## 0.10.2

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.10.2

## 0.10.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.10.1

## 0.10.0

### Minor Changes

- 23fb25d: feat(mcp): new `@unpunnyfuns/swatchbook-mcp` Model Context Protocol server

  Exposes a swatchbook DTCG project to AI agents — `describe_project`,
  `list_tokens` (filter by path glob + `$type`), `search_tokens`
  (case-insensitive substring across paths / descriptions / values),
  `resolve_theme` (resolved token map for an axis tuple), `get_token`,
  `get_alias_chain`, `get_aliased_by`, `get_consumer_output` (CSS var +
  compound `[data-…]` selector + HTML attrs), `get_color_formats` (hex
  / rgb / hsl / oklch / raw, each with an out-of-gamut flag),
  `list_axes`, `get_diagnostics`, `emit_css`. Runs without Storybook,
  parses the project via `@unpunnyfuns/swatchbook-core`, and watches
  resolved source files + the config so token edits flow into subsequent
  tool calls without restarting the transport (opt out with
  `--no-watch`).

  Consume as a CLI:

  ```sh
  npx @unpunnyfuns/swatchbook-mcp --config swatchbook.config.ts
  # or point straight at a DTCG resolver — no wrapper config needed:
  npx @unpunnyfuns/swatchbook-mcp --config tokens/resolver.json
  ```

  Or wire into an MCP client (Claude Desktop, etc.) via the same
  command. Ships with `createServer` + `loadFromConfig` exports for
  programmatic embedding in larger toolchains; `createServer(project)`
  returns the server augmented with a `setProject(next)` method for
  callers that want to orchestrate their own reload policy.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.10.0
