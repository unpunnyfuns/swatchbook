---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": patch
---

First half of #819. Extracts the wire-format snapshot helper that the addon's virtual-module plugin was duplicating across its two emit sites (module-body emission + HMR custom event) into a single browser-safe core subpath: `@unpunnyfuns/swatchbook-core/snapshot-for-wire`.

**New exports** (subpath: `/snapshot-for-wire`):
- `SnapshotForWire` interface — names the 11 fields the wire payload carries (axes, disabledAxes, presets, diagnostics, cssVarPrefix, css, listing, cells, jointOverrides, varianceByPath, defaultTuple) with JSON-friendly types (`Record` instead of `Map` for varianceByPath, slimmed `SlimListedToken` instead of the full `ListedToken`).
- `SnapshotForWire`'s sub-types `SlimListedToken` — the three fields blocks actually read from each listing entry.
- `snapshotForWire(project, css)` — builds a `SnapshotForWire` from a loaded `Project`. Does the Map-to-Object conversion for `varianceByPath` and the `slimListing` reduction in one place. The `css` arg is the `emitAxisProjectedCss(project)` output the plugin computes alongside the project load — not on `Project` itself.

**Refactor:**
- `packages/addon/src/virtual/plugin.ts` — both emit sites now call `snapshotForWire(project, css)`:
  - Module-body emit destructures and JSON-stringifies each field for ESM exports.
  - HMR `server.ws.send` passes the snapshot as the event `data` directly.
- The duplicated `slimListing` helper + `SlimListedToken` type are removed from the plugin (they live in core now).

**Still open for follow-up #819 work:** type-shape duplication across `packages/blocks/src/contexts.ts`, `packages/blocks/src/virtual.d.ts`, `packages/addon/src/channel-types.ts`, and `packages/addon/src/virtual.d.ts` (VirtualToken declared 3×, disabledAxes absent from blocks/virtual.d.ts, etc.). This PR consolidates the builders; the type-consolidation half follows separately because it cascades through ambient-module declarations + the manager-bundle import constraint.

Minor bump on core (new public subpath); patch on addon (no public API change, internal cleanup).
