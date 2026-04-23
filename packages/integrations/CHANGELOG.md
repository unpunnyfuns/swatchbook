# @unpunnyfuns/swatchbook-integrations

## 0.16.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [e702b29]
  - @unpunnyfuns/swatchbook-core@0.15.0

## 0.14.1

### Patch Changes

- Updated dependencies [b5976cd]
  - @unpunnyfuns/swatchbook-core@0.14.1

## 0.14.0

### Minor Changes

- 171c9aa: Auto-inject CSS-side-effect integrations into the Storybook preview. `SwatchbookIntegration.virtualModule.autoInject: true` opts a global-stylesheet integration (Tailwind's `@theme` block, any rules-heavy CSS) into an addon-managed import — consumers no longer hand-write a second `import 'virtual:swatchbook/…';` line after plugging the integration in. The addon's preview side-effect-imports an aggregate virtual module (`virtual:swatchbook/integration-side-effects`) whose body is generated from each auto-inject integration's virtualId.

  `@unpunnyfuns/swatchbook-integrations/tailwind` now opts in. Consumers drop the explicit `import 'virtual:swatchbook/tailwind.css'` from their `.storybook/preview.tsx`. CSS-in-JS stays as an explicit named-import (users write `import { theme, color } from 'virtual:swatchbook/theme'` where needed).

### Patch Changes

- Updated dependencies [171c9aa]
  - @unpunnyfuns/swatchbook-core@0.14.0

## 0.13.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.13.1

## 0.13.0

### Patch Changes

- 562bbc7: Release plumbing: `@unpunnyfuns/swatchbook-integrations` joins the fixed-version group so it releases in lockstep with core / addon / blocks / switcher / mcp (reaching `0.13.0` at its first publish).
- f66b9ef: Move `@unpunnyfuns/swatchbook-core` from `peerDependencies` to `dependencies`. The two packages ship together in the fixed-version group, so the peer-dep framing buys nothing and triggers Changesets' peer-dep safety cascade (forcing a major bump across the entire fixed group when any member's version moves).
- Updated dependencies [018f518]
- Updated dependencies [f03161f]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0
