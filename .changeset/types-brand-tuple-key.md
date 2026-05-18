---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-addon': patch
---

Brand `TupleKey` for canonical-tuple-key strings.

`canonicalKey` and `jointOverrideKey` now return a `TupleKey = string & { readonly __brand: 'TupleKey' }` instead of bare `string`. `Project.jointOverrides` and the in-memory memo Map inside `buildResolveAt` use it too, as does the wire-shape `jointOverrides` entry the addon ships through `virtual:swatchbook/tokens` for the blocks preview.

The brand catches places that pass an arbitrary string (token paths, axis names, theme display names) into a context expecting a canonical tuple key — these used to all compile as plain `string`. Structurally still `string`, so JSON round-trips and `Map` lookups behave identically; the brand is purely compile-time.

Scope is intentionally narrow per [issue #941](https://github.com/unpunnyfuns/swatchbook/issues/941)'s "alternative narrower scope" — axis and context names stay bare `string` to avoid casting every fixture literal.

`TupleKey` is exported from `@unpunnyfuns/swatchbook-core`.
