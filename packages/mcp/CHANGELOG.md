# @unpunnyfuns/swatchbook-mcp

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
