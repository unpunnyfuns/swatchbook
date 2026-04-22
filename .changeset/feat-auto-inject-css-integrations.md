---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-integrations': minor
---

Auto-inject CSS-side-effect integrations into the Storybook preview. `SwatchbookIntegration.virtualModule.autoInject: true` opts a global-stylesheet integration (Tailwind's `@theme` block, any rules-heavy CSS) into an addon-managed import — consumers no longer hand-write a second `import 'virtual:swatchbook/…';` line after plugging the integration in. The addon's preview side-effect-imports an aggregate virtual module (`virtual:swatchbook/integration-side-effects`) whose body is generated from each auto-inject integration's virtualId.

`@unpunnyfuns/swatchbook-integrations/tailwind` now opts in. Consumers drop the explicit `import 'virtual:swatchbook/tailwind.css'` from their `.storybook/preview.tsx`. CSS-in-JS stays as an explicit named-import (users write `import { theme, color } from 'virtual:swatchbook/theme'` where needed).
