---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
---

feat(core): chrome config with hard-coded literal defaults

Blocks now read ten chrome variables in a fixed `--swatchbook-*` namespace
(`--swatchbook-surface-default`, `--swatchbook-accent-bg`, etc.),
independent of the project's `cssVarPrefix`. Every chrome variable is
always declared — by default to hard-coded light-mode literals in
`DEFAULT_CHROME_MAP` (`#ffffff`, `#111827`, `system-ui, …`, etc.), so
zero config still gives readable themed chrome.

To wire chrome to your own tokens, supply a `chrome` map keyed by role
name. Any role you set becomes a `var(--<prefix>-<your-token>)`
reference that flips with your theme switches; the rest stay on the
literal defaults:

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

Composite sub-field targets (`'typography.sys.body.font-size'`) are
accepted. Unknown roles and unresolved targets produce `warn`
diagnostics (group `swatchbook/chrome`) and fall back to the literal
default.

The closed set of roles is exported as `CHROME_ROLES` with the
`ChromeRole` type and the default map as `DEFAULT_CHROME_MAP`, all from
`@unpunnyfuns/swatchbook-core`.

**Breaking (blocks internals):** `chromeAliases()` and `CHROME_VARS` are
removed from `@unpunnyfuns/swatchbook-blocks` — blocks no longer need to
rewire the project prefix on every wrapper because chrome vars are a
fixed namespace. Consumers only importing the public block components
are unaffected.
