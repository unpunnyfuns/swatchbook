---
'@unpunnyfuns/swatchbook-addon': minor
---

Display-side integration plugin system. The addon's Vite plugin now iterates a new `integrations: SwatchbookIntegration[]` option, serving each integration's virtual module and invalidating it on HMR. The addon itself stays tool-neutral — integrations ship as separate packages.

First integration published as `@unpunnyfuns/swatchbook-integrations/tailwind`: a virtual module (`virtual:swatchbook/tailwind.css`) whose `@theme` block aliases Tailwind v4 utility scales to the project's DTCG tokens via `var(--<cssVarPrefix>-*)` references, nested under the same prefix so they never collide with Tailwind's shipped scales. Users import it from `.storybook/preview` and the switch-toolbar flips every Tailwind utility via cascade.
