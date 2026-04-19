---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

Surface two previously-silent misconfiguration cases as `warn` diagnostics:

- `swatchbook/resolver` — resolver modifier with no `default` and no contexts. Previously collapsed to an axis with an empty-string `default` and propagated into theme names; now users see "Resolver modifier X has no default and no contexts — axis is unusable" in the Design Tokens panel.
- `swatchbook/project` — `config.disabledAxes` filtered out every theme. Previously rendered an empty tree with no hint; now the diagnostic names the pinned axes and suggests checking that their default contexts appear in the resolver's permutations.

Both are diagnostics, not errors — the project still loads. No behavior change for valid configs.
