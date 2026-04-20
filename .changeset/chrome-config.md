---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
---

feat(core): chrome config for aliasing consumer tokens to block chrome

Blocks now read ten chrome variables in a fixed `--swatchbook-*` namespace
(`--swatchbook-surface-default`, `--swatchbook-accent-bg`, etc.),
independent of the project's `cssVarPrefix`. Without any config, chrome
falls back to `Canvas` / `CanvasText` system colors. Projects that want
to theme block chrome from their own tokens supply a `chrome` map keyed
by role name (camelCase):

```ts
swatchbookAddon({
  config: {
    chrome: {
      surfaceDefault: 'color.brand.bg.primary',
      textDefault:    'color.brand.fg.primary',
      accentBg:       'color.brand.accent.primary',
    },
  },
});
```

Each entry emits a `:root` alias
`--swatchbook-<role>: var(--<prefix>-<target>);`, so per-theme values flip
automatically through the target's existing per-theme emission. Composite
sub-field targets (`'typography.sys.body.font-size'`) are accepted.

The closed set of roles is exported as `CHROME_ROLES` with type
`ChromeRole` from `@unpunnyfuns/swatchbook-core`.

**Breaking (blocks internals):** `chromeAliases()` and `CHROME_VARS` are
removed from `@unpunnyfuns/swatchbook-blocks` — blocks no longer need to
rewire the project prefix on every wrapper because chrome vars are a
fixed namespace. Consumers only importing the public block components are
unaffected.
