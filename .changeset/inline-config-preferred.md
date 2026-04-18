---
'@unpunnyfuns/swatchbook-addon': minor
---

Inline configuration in `.storybook/main.ts` is now the documented default — `options.config` takes a `Config` object directly, no separate `swatchbook.config.ts` file required. `options.configPath` is still supported; it's the right answer when you want the same config consumed by other tooling (a CLI, a CI lint job) alongside Storybook. READMEs, quickstart, and the config reference page all lead with the inline shape.

No API change — both options already existed on the addon. The addon's own fixture (`apps/storybook/.storybook/main.ts`) switches to inline to dogfood the preferred setup.
