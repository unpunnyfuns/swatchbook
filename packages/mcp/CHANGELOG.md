# @unpunnyfuns/swatchbook-mcp

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
