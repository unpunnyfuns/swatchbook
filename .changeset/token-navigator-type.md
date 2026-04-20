---
'@unpunnyfuns/swatchbook-blocks': minor
---

feat(blocks): `type` prop on `<TokenNavigator>`

Scope the tree by DTCG `$type`. Pass a single string (`type="color"`) to restrict to one type, or an array (`type={['duration', 'cubicBezier', 'transition']}`) for a small-multiples view. Composes with `root` — both constraints must hold. Matches the `type` prop already available on `<TokenTable>`.
