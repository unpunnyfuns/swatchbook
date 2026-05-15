/**
 * Coerce a CSS `var(--…)` reference into the numeric slot of a React
 * inline-style property.
 *
 * React's `CSSProperties` types unitless properties (`fontWeight`,
 * `lineHeight`, `zIndex`, …) as `number`. The DOM accepts a string at
 * runtime — the rendered stylesheet just receives whatever React passes —
 * so a `var(--font-weight)` reference works functionally. TypeScript still
 * complains. Centralising the type assertion in one named helper keeps
 * the gap visible (and greppable) instead of scattering casts across
 * block components that want CSS-var-driven typography or layout values.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — React's CSSProperties slot is `number`; the DOM tolerates a CSS var string.
export const cssVarAsNumber = (varRef: string): number => varRef;
