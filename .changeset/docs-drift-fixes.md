---
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-core': patch
---

Doc-audit drift fixes (third of three thematic PRs after #918 and #920):

- `core.mdx` + `core/README.md` "Boundaries" / "Do / don't" — rewrite the stale `parserInput`-references-the-AST line. `parserInput` no longer ships on `Project` (removed in #901); the real reason not to ship `Project` to the browser is that `resolveAt` is a function, `varianceByPath` is a Map, and `cwd` is a Node-side absolute path.
- `core.mdx` `SwatchbookIntegration` example — add the previously-omitted `autoInject?: boolean` field with its documented semantics.
- `architecture.mdx` `Project` inline shape — add the missing `listing: TokenListingByPath` field.
- `addon.mdx` block-side hooks section — soften the wrong "not re-exported from the addon" claim; the addon's main entry does `export * from blocks` + `from switcher`, so block-side hooks are reachable from `@unpunnyfuns/swatchbook-addon` directly.
- `addon/src/index.ts` — actually export the addon-namespace constants (`ADDON_ID`, `AXES_GLOBAL_KEY`, `COLOR_FORMAT_GLOBAL_KEY`, `PARAM_KEY`, `TOOL_ID`, `VIRTUAL_MODULE_ID`) that `addon.mdx`'s "Exported constants" section claimed were importable but weren't. `TOOL_ID` added to the doc list.
