---
'@unpunnyfuns/swatchbook-core': patch
---

Declare `@terrazzo/parser` and `@terrazzo/plugin-css` as peer dependencies on swatchbook-core (still listed under `dependencies` too). Terrazzo's ecosystem plugins — `@terrazzo/plugin-swift`, `-android`, `-sass`, `-js`, etc. — all peer-depend on `@terrazzo/parser`. Without the peer declaration on our side, a user installing `plugin-swift@3.x` next to our `parser@2.x` would hit silent API-shape mismatches (parser 3 and plugin 3 talk one protocol; parser 2 talks another). Now pnpm can hoist to a single shared parser instance and surface version mismatches at install time instead of at render time.

No runtime behavior change; installs that already satisfy the range see no difference.
