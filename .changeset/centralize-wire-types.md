---
"@unpunnyfuns/swatchbook-blocks": patch
---

Closes #819. Second-half follow-up to PR #883 (which extracted the `snapshotForWire` builder helper). This PR consolidates the duplicated wire-shape type declarations on the blocks side:

**Before:**
- `packages/blocks/src/contexts.ts` exported `VirtualTokenShape`, `VirtualTokenListingShape`, etc.
- `packages/blocks/src/virtual.d.ts` re-declared the same shapes inline inside the `declare module 'virtual:swatchbook/tokens'` block.
- That virtual.d.ts was missing the `disabledAxes` export (silent drift from the addon's emitter, which has shipped `disabledAxes` over the wire since v0.55).

**After:**
- `VirtualTokenListingShape` now aliases `SlimListedToken` from `@unpunnyfuns/swatchbook-core/snapshot-for-wire` — cross-package alignment, same definition both addon-server-side and blocks-consumer-side.
- `packages/blocks/src/virtual.d.ts` imports its types from `#/contexts.ts` (mirroring the cleaner pattern `packages/addon/src/virtual.d.ts` already uses with its `#/channel-types.ts`). The inline declarations are gone.
- `disabledAxes` is now declared in `blocks/virtual.d.ts` — wire shape matches what the addon's emit + the existing `blocks/test/virtual-stub.ts` already provided.

Net duplication: the `VirtualToken`/`Virtual*` interfaces dropped from 3× (contexts.ts + 2 virtual.d.ts variants) to 2× (one per package — blocks' `contexts.ts` and addon's `channel-types.ts`). Cross-package single-sourcing isn't feasible without violating the manager-bundle's Node-free import constraint; per-package single-sourcing is the achievable end state.

No source changes; pure type-shape consolidation.
