---
'@unpunnyfuns/swatchbook-addon': patch
---

fix(addon): pick up token edits when tokens live in a sibling workspace package

Two overlapping bugs in the virtual-module plugin's dev-server watcher
conspired to drop every token edit on the floor when tokens lived
outside the Storybook project's own directory:

1. `configureServer` runs **before** `buildStart` in Vite's plugin
   lifecycle, so `project` (and therefore `project.sourceFiles`) was
   still undefined when we derived the watcher set. For configs that
   supply a `resolver` but no `tokens` glob — which the reference
   Storybook and most real-world consumers ship — every `$ref` target
   silently dropped; only the resolver file itself was watched. Force
   an initial `refresh()` at the top of `configureServer` so
   `sourceFiles` is populated before the watcher wiring runs.

2. Even with `sourceFiles` populated, `server.watcher.add()` is rooted
   at the dev server's project directory; absolute paths added outside
   that root don't reliably emit change events across pnpm-symlinked
   package boundaries. Replace the Vite dir-level watch with a direct
   `node:fs.watch` on each source file — native, no root constraint,
   fires on every save.

Saves to any token file pulled in by the resolver now invalidate the
`virtual:swatchbook/tokens` module and trigger a single full-reload in
the preview — no dev-server restart required.
