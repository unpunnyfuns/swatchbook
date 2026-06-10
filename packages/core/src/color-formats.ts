/**
 * The color display formats swatchbook understands, shared across the
 * blocks display surface, the MCP server's agent output, and the addon
 * toolbar selector.
 *
 * Kept colorjs-free (no `formatColor` import) so the addon manager bundle
 * can import the list without dragging colorjs.io in — see
 * [[format-color.ts]] for the rendering kernel.
 *
 * - `hex` — sRGB hex (`#rrggbb` / `#rrggbbaa`); out-of-gamut falls back to `rgb()`.
 * - `rgb` / `hsl` — CSS Color 4 space-separated syntax.
 * - `oklch` — perceptual wide-gamut form.
 * - `raw` — the normalized color payload (rendering is consumer-specific).
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch' | 'raw';

export const COLOR_FORMATS: readonly ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch', 'raw'];
