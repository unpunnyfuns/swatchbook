---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
---

feat(core): add `chrome` config for aliasing consumer tokens to block chrome

Blocks read ten fixed chrome variables (`color.sys.surface.default`, `color.sys.text.default`, etc.). Projects whose token model doesn't expose those paths natively can now supply a `chrome` map that redirects each chrome path to a token path in the consumer's own tree — the CSS emitter appends `:root` aliases that inherit per-theme values automatically through the existing var indirection.

```ts
swatchbookAddon({
  config: {
    chrome: {
      'color.sys.surface.default': 'color.brand.bg.primary',
      'color.sys.text.default': 'color.brand.fg.primary',
    },
  },
});
```

Unknown source keys (outside `CHROME_PATHS`) and target paths that don't resolve in any theme produce `warn` diagnostics (group `swatchbook/chrome`) and are dropped. `CHROME_PATHS` and the `ChromePath` type are exported from `@unpunnyfuns/swatchbook-core`.
