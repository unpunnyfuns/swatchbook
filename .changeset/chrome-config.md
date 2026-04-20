---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
---

feat(core): chrome config for aliasing consumer tokens to block chrome

Blocks now read ten chrome variables in a fixed `--swatchbook-*` namespace
(e.g. `--swatchbook-color-surface-default`), independent of the project's
`cssVarPrefix`. Without any config, chrome falls back to `Canvas` /
`CanvasText` system colors. Projects that want to theme block chrome from
their own tokens supply a `chrome` map:

```ts
swatchbookAddon({
  config: {
    chrome: {
      'color.surface.default': 'color.brand.bg.primary',
      'color.text.default': 'color.brand.fg.primary',
    },
  },
});
```

Each entry emits a `:root` alias
`--swatchbook-color-surface-default: var(--<prefix>-color-brand-bg-primary);`,
so per-theme values flip automatically through the target's existing
per-theme emission.

**Breaking (blocks internals):** `chromeAliases()` and `CHROME_VARS` are
removed from `@unpunnyfuns/swatchbook-blocks` — blocks no longer need to
rewire the project prefix on every wrapper because chrome vars are a
fixed namespace. Consumers only importing the public block components are
unaffected.

`CHROME_PATHS` and the `ChromePath` type are exported from
`@unpunnyfuns/swatchbook-core` for consumers who want a typed list of the
ten roles.
