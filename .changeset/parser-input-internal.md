---
"@unpunnyfuns/swatchbook-core": minor
---

Closes #820. The `ParserInput` type is no longer exported from `@unpunnyfuns/swatchbook-core`'s barrel. The type still exists internally (the loader produces it, `emitViaTerrazzo` consumes it) but is no longer part of the public API surface — its old presence on the barrel surfaced Terrazzo's `Resolver` + `InputSourceWithDocument` types into consumer-visible TypeScript without intent.

`Project.parserInput` itself remains as an optional field on `Project` (resolver-backed projects populate it, layered/plain-parse projects leave it `undefined`). JSDoc updated to mark it `@internal` — consumers should pass the `Project` to `emitViaTerrazzo` rather than reaching for the field directly. The shape may move under a different name in future releases.

The `Project.parserInput?:` optional-with-omit form (rather than `T | undefined`) is unchanged — the audit finding called out a non-existent issue here; the file always used the correct `exactOptionalPropertyTypes`-compatible form.

Pre-1.0 minor bump per the project's semver policy.
